import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import {
  Camera,
  CameraOff,
  ScanFace,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Trash2,
  Search,
  Users,
  Sparkles,
  Check,
  Lock,
  Shield,
  HelpCircle
} from 'lucide-react';
import { ClassSection, Subject, Student, User } from '../types';

const BIOMETRIC_ENROLLMENT_AVAILABLE = true;

interface FaceRecognitionAttendanceProps {
  currentUser: User | null;
  classes: ClassSection[];
  subjects: Subject[];
  students?: Student[];
  initialTargetStudent?: Student | null;
  onAttendanceMarked?: () => void;
}

interface EnrolledStudent {
  id: number;
  student_code: string;
  roll_number: string;
  full_name: string;
  email: string;
  avatar: string;
  class_id: number;
  class_name: string;
  is_enrolled: boolean;
  sample_count: number;
  consent_obtained: boolean;
  liveness_score_enrolled: number | null;
  enrolled_at: string | null;
  enrolled_by_name: string | null;
}

interface RecognitionResult {
  status: 'SUCCESS' | 'ALREADY_MARKED' | 'ERROR';
  student_name?: string;
  roll_number?: string;
  avatar?: string;
  class_name?: string;
  time?: string;
  similarity?: number;
  message: string;
}

export const FaceRecognitionAttendance: React.FC<FaceRecognitionAttendanceProps> = ({
  currentUser,
  classes,
  students = [],
  initialTargetStudent = null,
  onAttendanceMarked,
}) => {
  // Selected class for staff face enrollment.
  const [selectedClass, setSelectedClass] = useState<number>(initialTargetStudent?.class_id || classes[0]?.id || 1);

  // Camera & Stream State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningProgress, setScanningProgress] = useState(0);

  const [showPermissionGuide, setShowPermissionGuide] = useState(false);

  // Video and Canvas Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Recognition Feedback
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [verifiedCountToday, setVerifiedCountToday] = useState(0);

  // Enrollment State
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [enrollSearch, setEnrollSearch] = useState('');
  const [selectedStudentForEnroll, setSelectedStudentForEnroll] = useState<EnrolledStudent | null>(null);
  const [capturedSamples, setCapturedSamples] = useState<number[][]>([]);
  const [consentGranted, setConsentGranted] = useState(false);
  const [enrollSubmitting, setEnrollSubmitting] = useState(false);
  const [enrollMessage, setEnrollMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const faceModelsLoadedRef = useRef(false);

  const ensureFaceModelsReady = async () => {
    if (faceModelsLoadedRef.current) return;
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      ]);
      faceModelsLoadedRef.current = true;
    } catch (error) {
      console.error('Failed to load local face recognition models:', error);
      throw new Error('Local face models could not be loaded. Check the files in public/models and refresh the page.');
    }
  };

  const extractFaceDescriptor = async (source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement): Promise<number[]> => {
    await ensureFaceModelsReady();
    const detected = await faceapi.detectSingleFace(source, new faceapi.TinyFaceDetectorOptions({
      inputSize: 320,
      scoreThreshold: 0.45,
    }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detected) {
      throw new Error('No face was detected in the live camera feed. Center your face in the frame and keep good lighting.');
    }

    return Array.from(detected.descriptor).map(value => Number(value));
  };

  // Fetch enrolled students
  const fetchEnrolledStudents = async () => {
    try {
      const res = await fetch('/api/face-recognition/students');
      const responseText = await res.text();
      let data: unknown;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(`Could not load the face enrollment directory (HTTP ${res.status}).`);
      }
      if (!res.ok) {
        const message = typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
          ? data.error
          : `Could not load the face enrollment directory (HTTP ${res.status}).`;
        throw new Error(message);
      }
      if (!Array.isArray(data)) throw new Error('The face enrollment directory response was invalid.');
      setEnrolledStudents(data as EnrolledStudent[]);
    } catch (err) {
      console.error('Failed to fetch enrolled students:', err);
      setEnrollMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not load the face enrollment directory.',
      });
    }
  };

  useEffect(() => {
    fetchEnrolledStudents();
  }, []);

  useEffect(() => {
    if (!initialTargetStudent || currentUser?.role === 'STUDENT') return;
    const target = enrolledStudents.find(student => student.id === initialTargetStudent.id);
    if (target) {
      setSelectedStudentForEnroll(target);
    }
  }, [initialTargetStudent, enrolledStudents, currentUser?.role]);

  // Bind student sessions to their own class and record.
  useEffect(() => {
    if (initialTargetStudent) {
      setSelectedClass(initialTargetStudent.class_id);
    } else if (currentUser?.role === 'STUDENT') {
      const myStudent = students.find(s => s.user_id === currentUser.id || s.email.toLowerCase() === currentUser.email?.toLowerCase());
      if (myStudent) {
        setSelectedClass(myStudent.class_id);
      }
    }
  }, [initialTargetStudent, currentUser, students]);

  // Safe Camera Initialization (Physical Hardware Webcam)
  const startCamera = async () => {
    setCameraError(null);
    setShowPermissionGuide(false);
    setResult(null);
    let stream: MediaStream | null = null;

    try {
      if (!window.isSecureContext) {
        throw new Error('Camera access requires HTTPS or localhost. Open the app using https:// or http://localhost.');
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam media streaming is not supported by your browser or environment.');
      }

      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false,
      });

      streamRef.current = stream;
      if (!videoRef.current) throw new Error('The camera preview is not ready. Please retry.');
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setIsCameraActive(true);
    } catch (err: unknown) {
      console.warn('Physical camera access error:', err);
      const errorName = err instanceof Error ? err.name : '';
      let errMsg = err instanceof Error ? err.message : 'Unable to access camera.';
      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        errMsg = 'Camera permission was denied. Allow camera access for this site in your browser settings, then retry.';
        setShowPermissionGuide(true);
      } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        errMsg = 'No video camera was detected. Connect a camera and try again.';
      } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
        errMsg = 'Camera is currently in use by another application. Please close other camera tabs.';
      }
      stream?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraError(errMsg);
      setIsCameraActive(false);
    }
  };

  // Safe Camera Shutdown & Resource Release
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Execute Face Attendance Scan & Verification
  const handleScanAttendance = async () => {
    if (!isCameraActive || isScanning) return;
    if (!videoRef.current?.srcObject) {
      setResult({
        status: 'ERROR',
        message: 'Attendance check-in requires an active physical webcam.',
      });
      return;
    }
    if (currentUser?.role !== 'STUDENT') {
      setResult({
        status: 'ERROR',
        message: 'Face recognition is unavailable for staff marking. Use the authorized classroom register.',
      });
      return;
    }
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setResult({ status: 'ERROR', message: 'The live camera has not produced a frame yet. Please wait and try again.' });
      return;
    }

    setIsScanning(true);
    setScanningProgress(20);
    setResult(null);

    try {
      setScanningProgress(40);
      const descriptor = await extractFaceDescriptor(video);
      setScanningProgress(60);

      const res = await fetch('/api/attendance/live-camera-check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descriptor })
      });

      const responseText = await res.text();
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(responseText) as Record<string, unknown>;
      } catch {
        const detail = responseText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        throw new Error(detail
          ? `Camera check-in failed (HTTP ${res.status}): ${detail.slice(0, 300)}`
          : `Camera check-in failed (HTTP ${res.status}).`);
      }
      setScanningProgress(100);

      if (!res.ok) {
        setResult({
          status: 'ERROR',
          message: typeof data.error === 'string' ? data.error : `Camera check-in failed (HTTP ${res.status}).`,
        });
      } else {
        if (data.already_marked === true) {
          setResult({
            status: 'ALREADY_MARKED',
            student_name: typeof data.student_name === 'string' ? data.student_name : undefined,
            roll_number: typeof data.roll_number === 'string' ? data.roll_number : undefined,
            class_name: typeof data.class_name === 'string' ? data.class_name : undefined,
            time: typeof data.existing_time === 'string' ? data.existing_time : undefined,
            message: typeof data.message === 'string' ? data.message : 'Your college attendance has already been recorded today.',
          });
        } else {
          setResult({
            status: 'SUCCESS',
            student_name: typeof data.student_name === 'string' ? data.student_name : undefined,
            roll_number: typeof data.roll_number === 'string' ? data.roll_number : undefined,
            class_name: typeof data.class_name === 'string' ? data.class_name : undefined,
            time: typeof data.time === 'string' ? data.time : undefined,
            similarity: typeof data.similarity === 'number' ? data.similarity : undefined,
            message: typeof data.message === 'string' ? data.message : 'Attendance was marked successfully.',
          });
          setVerifiedCountToday(prev => prev + 1);
          if (onAttendanceMarked) onAttendanceMarked();
        }
      }
    } catch (err) {
      console.error('Face verification error:', err);
      setResult({
        status: 'ERROR',
        message: err instanceof Error ? err.message : 'Network error or server unavailable during biometric verification.',
      });
    } finally {
      setIsScanning(false);
      setTimeout(() => setScanningProgress(0), 1000);
    }
  };

  // Handle Enrollment Sample Capture
  const handleCaptureSample = async () => {
    if (!videoRef.current) return;

    try {
      const descriptor = await extractFaceDescriptor(videoRef.current);
      if (capturedSamples.length < 3) {
        setCapturedSamples(prev => [...prev, descriptor]);
      }
    } catch (err) {
      setEnrollMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'The camera could not produce a usable face descriptor.',
      });
    }
  };

  // Submit Biometric Enrollment
  const handleSubmitEnrollment = async () => {
    if (!BIOMETRIC_ENROLLMENT_AVAILABLE) {
      setEnrollMessage({
        type: 'error',
        text: 'Trusted server-side biometric enrollment is not configured. No face template was saved.',
      });
      return;
    }
    if (!selectedStudentForEnroll) {
      setEnrollMessage({ type: 'error', text: 'Please select a student to enroll.' });
      return;
    }
    if (!consentGranted) {
      setEnrollMessage({
        type: 'error',
        text: 'Biometric privacy consent must be acknowledged before registering facial templates.'
      });
      return;
    }

    setEnrollSubmitting(true);
    setEnrollMessage(null);

    try {
      if (capturedSamples.length < 3) {
        throw new Error('Capture three live camera samples before enrolling this student.');
      }

      const res = await fetch('/api/face-recognition/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudentForEnroll.id,
          samples: capturedSamples,
          consent_obtained: true,
        })
      });

      const responseText = await res.text();
      let data: { error?: string; message?: string };
      try {
        data = JSON.parse(responseText) as { error?: string; message?: string };
      } catch {
        const detail = responseText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        throw new Error(detail
          ? `Face enrollment failed (HTTP ${res.status}): ${detail.slice(0, 300)}`
          : `Face enrollment failed (HTTP ${res.status}).`);
      }
      if (!res.ok) {
        throw new Error(data.error || data.message || `Face enrollment failed (HTTP ${res.status}).`);
      }

      setEnrollMessage({
        type: 'success',
        text: `Facial biometric profile enrolled successfully for ${selectedStudentForEnroll.full_name} (${selectedStudentForEnroll.roll_number})!`
      });

      setCapturedSamples([]);
      setConsentGranted(false);
      fetchEnrolledStudents();
    } catch (err: any) {
      setEnrollMessage({ type: 'error', text: err.message || 'Error saving biometric template.' });
    } finally {
      setEnrollSubmitting(false);
      setCapturedSamples([]);
    }
  };

  // Delete Biometric Template
  const handleDeleteEnrollment = async (studentId: number, studentName: string) => {
    if (!window.confirm(`Are you sure you want to permanently erase the facial biometric template for ${studentName}? This action is logged for privacy audit compliance.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/face-recognition/enroll/${studentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setEnrollMessage({ type: 'success', text: data.message });
        fetchEnrolledStudents();
        if (selectedStudentForEnroll?.id === studentId) {
          setSelectedStudentForEnroll(null);
        }
      } else {
        setEnrollMessage({ type: 'error', text: data.error || 'Failed to delete template.' });
      }
    } catch (err: any) {
      setEnrollMessage({ type: 'error', text: 'Error connecting to server.' });
    }
  };

  const filteredStudents = enrolledStudents.filter(s =>
    s.full_name.toLowerCase().includes(enrollSearch.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(enrollSearch.toLowerCase()) ||
    s.student_code.toLowerCase().includes(enrollSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#EAF5F0] text-[#3F8F72] flex items-center justify-center">
                <ScanFace className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#292524] tracking-tight">
                  {currentUser?.role === 'STUDENT' ? 'Live Camera Attendance Check-In' : 'Student Face Enrollment'}
                </h1>
                <p className="text-xs text-[#78716C]">
                  {currentUser?.role === 'STUDENT'
                    ? 'The local face model matches your live camera capture against your consented profile.'
                    : 'Enroll a registered student with consent using three live camera samples.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main View Body */}
      {currentUser?.role === 'STUDENT' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Live Camera & Scanner Interface (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* General college attendance status */}
            <div className="bg-white rounded-2xl border border-[#E7E5E4] p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#57534E]">
                <CheckCircle2 className="w-4 h-4 text-[#3F8F72]" />
                <span>General college attendance · one check-in per day</span>
              </div>

              {/* Verified Count Badge */}
              <div className="flex items-center gap-2 text-xs font-semibold text-[#3F8F72] bg-[#EAF5F0] px-3 py-1.5 rounded-lg border border-[#3F8F72]/20">
                <CheckCircle2 className="w-4 h-4" />
                <span>Marked via Camera: {verifiedCountToday}</span>
              </div>
            </div>

            {/* Video Viewport Container */}
            <div className="relative bg-black rounded-2xl overflow-hidden border border-[#E7E5E4] shadow-md aspect-4/3 flex items-center justify-center">
              
              {/* Actual Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
              />

              {/* Offscreen Canvas for Frame Processing */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Placeholder when Camera is OFF or ERRORED */}
              {!isCameraActive && (
                <div className="flex flex-col items-center justify-center p-6 text-center text-white/90 max-w-lg z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-inner ${showPermissionGuide || cameraError ? 'bg-amber-500/20 border border-amber-400/30 text-amber-400' : 'bg-white/10 text-white/80'}`}>
                    {showPermissionGuide || cameraError ? (
                      <AlertTriangle className="w-7 h-7 text-amber-400" />
                    ) : (
                      <CameraOff className="w-7 h-7 text-white/80" />
                    )}
                  </div>

                  {showPermissionGuide ? (
                    <div className="space-y-3 mb-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30">
                        <Lock className="w-3 h-3" />
                        <span>Camera Access Blocked</span>
                      </div>
                      <h3 className="text-sm font-bold text-white">Browser Camera Permission Required</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Your browser has blocked webcam streaming. Allow camera access in browser settings, then retry.
                      </p>

                      <div className="bg-white/10 border border-white/10 rounded-xl p-3 text-left text-[11px] text-slate-200 space-y-1.5 backdrop-blur-xs">
                        <p className="font-semibold text-amber-300 flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5" /> How to allow camera:
                        </p>
                        <ol className="list-decimal list-inside space-y-1 text-slate-300">
                          <li>Click the <strong>🔒 Lock</strong> or <strong>🎥 Camera</strong> icon next to the URL in your browser address bar.</li>
                          <li>Change <strong>Camera</strong> permission to <strong>Allow</strong>.</li>
                          <li>Click <strong>Retry Physical Camera</strong> below.</li>
                        </ol>
                      </div>
                    </div>
                  ) : cameraError ? (
                    <div className="space-y-2 mb-4">
                      <h3 className="text-sm font-bold text-white">Unable to Start Camera</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-sm font-semibold text-white mb-1">Face Recognition Camera Inactive</h3>
                      <p className="text-xs text-white/60 max-w-sm mb-4">
                        Start your physical webcam to verify your identity and mark attendance.
                      </p>
                    </>
                  )}

                  {/* Primary Action Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    <button
                      onClick={startCamera}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 shadow-sm cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <span>{showPermissionGuide ? 'Retry Physical Camera' : 'Start Webcam'}</span>
                    </button>

                  </div>
                </div>
              )}

              {/* Live Face Detection Bounding Frame Overlay */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-8">
                  
                  {/* Facial Scanner Target Box */}
                  <div className="relative w-64 h-72 border-2 border-[#3F8F72] rounded-3xl overflow-hidden shadow-2xl transition-all">
                    {/* Corner Accent Brackets */}
                    <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-white rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-white rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-white rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-white rounded-br-xl" />

                    {/* Animated Laser Scanning Line */}
                    {isScanning && (
                      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#3F8F72] to-transparent shadow-[0_0_12px_#3F8F72] animate-bounce" />
                    )}

                    {/* Status Text Inside Box */}
                    <div className="absolute bottom-3 inset-x-0 text-center">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md bg-black/60 text-white backdrop-blur-sm">
                        {isScanning ? 'Matching Face...' : 'Camera Ready'}
                      </span>
                    </div>
                  </div>

                  {/* A camera preview does not prove liveness or face identity. */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-[11px] font-medium border border-white/10">
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Camera preview only</span>
                  </div>

                  {/* Resolution, Source & FPS Pill */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white/80 text-[10px] font-mono border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>LIVE WEBCAM</span>
                  </div>
                </div>
              )}

              {/* Scanning Progress Bar */}
              {isScanning && (
                <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/40">
                  <div
                    className="h-full bg-[#3F8F72] transition-all duration-300"
                    style={{ width: `${scanningProgress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Camera Controls Toolbar */}
            <div className="bg-white rounded-2xl border border-[#E7E5E4] p-4 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {isCameraActive ? (
                    <button
                      onClick={stopCamera}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F5F5F4] hover:bg-[#E7E5E4] text-[#78716C] text-xs font-bold transition-all cursor-pointer"
                    >
                      <CameraOff className="w-4 h-4" />
                      <span>Stop Camera</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={startCamera}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                        title="Start physical hardware webcam"
                      >
                        <Camera className="w-4 h-4 text-emerald-400" />
                        <span>Start Live Camera</span>
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleScanAttendance}
                    disabled={!isCameraActive || isScanning}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                      isCameraActive && !isScanning
                        ? 'bg-[#3F8F72] hover:bg-[#347A60] text-white'
                        : 'bg-[#E7E5E4] text-[#A8A29E] cursor-not-allowed'
                    }`}
                  >
                    <ScanFace className="w-4 h-4" />
                    <span>{isScanning ? 'Matching Face...' : currentUser?.role === 'STUDENT' ? 'Verify Face & Mark Attendance' : 'Use Classroom Register'}</span>
                  </button>

                </div>

                {/* Face matching does not perform anti-spoofing. */}
                <div className="flex items-center gap-1.5 text-[11px] text-[#78716C]">
                  <Shield className="w-3.5 h-3.5 text-[#3F8F72]" />
                  <span>
                    {currentUser?.role === 'STUDENT'
                      ? 'Local face matching verifies your enrolled template; it does not verify liveness or prevent photo replay.'
                      : 'Live camera is available for preview; staff should mark attendance through the authorized classroom register.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Error Message Feedback with One-Click Fix */}
            {cameraError && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#991B1B]">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{cameraError}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Verification Results & Real-Time Intelligence (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Real-time Recognition Result Card */}
            <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
                <h3 className="text-xs font-bold text-[#292524] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#3F8F72]" />
                  <span>Verification Result</span>
                </h3>
                {result && (
                  <span className="text-[10px] font-mono text-[#78716C]">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              {result ? (
                <div className="space-y-4">
                  
                  {/* Status Banner */}
                  {result.status === 'SUCCESS' && (
                    <div className="p-4 rounded-xl bg-[#EAF5F0] border border-[#3F8F72]/30 text-[#1B4332] space-y-2">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <CheckCircle2 className="w-5 h-5 text-[#3F8F72]" />
                        <span>Attendance Marked Successfully!</span>
                      </div>
                      <p className="text-xs text-[#2D6A4F]">{result.message}</p>
                    </div>
                  )}

                  {result.status === 'ALREADY_MARKED' && (
                    <div className="p-4 rounded-xl bg-[#FEF9C3] border border-[#FDE047] text-[#854D0E] space-y-2">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <AlertTriangle className="w-5 h-5 text-[#CA8A04]" />
                        <span>Attendance Already Recorded</span>
                      </div>
                      <p className="text-xs">{result.message}</p>
                    </div>
                  )}

                  {/* Student Details Card (Only shown if student matched) */}
                  {result.student_name && (
                    <div className="bg-[#FAFAF9] rounded-xl border border-[#E7E5E4] p-4 flex items-center gap-3.5">
                      <img
                        src={result.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200'}
                        alt={result.student_name}
                        className="w-14 h-14 rounded-xl object-cover border border-[#E7E5E4] shadow-xs"
                      />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[#292524]">{result.student_name}</h4>
                        <p className="text-[11px] font-mono font-medium text-[#78716C]">{result.roll_number}</p>
                        <div className="flex items-center gap-2 text-[10px] text-[#57534E]">
                          <span>{result.class_name}</span>
                          <span>•</span>
                          <span>Time: {result.time}</span>
                        </div>
                        {result.similarity !== undefined && (
                          <div className="inline-block px-2 py-0.5 rounded bg-[#EAF5F0] text-[#3F8F72] text-[10px] font-bold">
                            Face similarity: {(result.similarity * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="py-12 text-center text-[#78716C] space-y-2">
                  <ScanFace className="w-10 h-10 mx-auto text-[#A8A29E] stroke-[1.5]" />
                  <p className="text-xs font-medium">Ready for camera check-in</p>
                  <p className="text-[11px] text-[#A8A29E] max-w-xs mx-auto">
                    Start the live camera, then choose "Verify Face &amp; Mark Attendance" to record your college attendance.
                  </p>
                </div>
              )}
            </div>

            {/* Explain the model's security limitation. */}
            <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#292524]">
                <ShieldCheck className="w-4 h-4 text-[#3F8F72]" />
                <span>Camera Check-In Security</span>
              </div>
              <p className="text-[11px] text-[#57534E]">
                The browser generates a face descriptor from the live camera, and the server compares it with your encrypted, consented template before recording attendance. This model does not verify liveness, so photo or screen replay may be accepted. Use in supervised settings and keep a manual register fallback.
              </p>
            </div>

          </div>

        </div>
      ) : (
        /* Enrollment Mode View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Student Selection & Registry (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E7E5E4] p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-[#292524]">Registered Students Registry</h2>
              <p className="text-xs text-[#78716C]">Select a student to capture samples or manage biometric templates</p>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, roll number, or code..."
                value={enrollSearch}
                onChange={e => setEnrollSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-[#F5F5F4] border border-[#E7E5E4] rounded-xl text-[#292524] placeholder-[#A8A29E] focus:outline-none focus:border-[#3F8F72]"
              />
            </div>

            {/* Students List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredStudents.map(stu => {
                const isSelected = selectedStudentForEnroll?.id === stu.id;
                return (
                  <div
                    key={stu.id}
                    onClick={() => {
                      setSelectedStudentForEnroll(stu);
                      setCapturedSamples([]);
                      setEnrollMessage(null);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-[#3F8F72] bg-[#EAF5F0]'
                        : 'border-[#E7E5E4] bg-white hover:bg-[#F5F5F4]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={stu.avatar}
                        alt={stu.full_name}
                        className="w-10 h-10 rounded-xl object-cover border border-[#E7E5E4]"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-[#292524]">{stu.full_name}</h4>
                        <p className="text-[11px] font-mono text-[#78716C]">{stu.roll_number}</p>
                        <span className="text-[10px] text-[#A8A29E]">{stu.class_name}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {stu.is_enrolled ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF5F0] text-[#3F8F72] border border-[#3F8F72]/30">
                          <Check className="w-3 h-3" />
                          <span>Enrolled</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F5F5F4] text-[#78716C] border border-[#E7E5E4]">
                          Not Enrolled
                        </span>
                      )}

                      {stu.is_enrolled && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEnrollment(stu.id, stu.full_name);
                          }}
                          title="Revoke / Delete biometric data"
                          className="text-[#D95C5C] hover:text-[#991B1B] p-1 rounded-md hover:bg-[#FEF2F2] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Enrollment Capture Camera & Biometric Vault (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {selectedStudentForEnroll ? (
              <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 shadow-sm space-y-5">
                
                {/* Selected Student Banner */}
                <div className="flex items-center justify-between pb-4 border-b border-[#E7E5E4]">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedStudentForEnroll.avatar}
                      alt={selectedStudentForEnroll.full_name}
                      className="w-12 h-12 rounded-xl object-cover border border-[#E7E5E4]"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-[#292524]">{selectedStudentForEnroll.full_name}</h3>
                      <p className="text-xs font-mono text-[#78716C]">
                        {selectedStudentForEnroll.roll_number} • {selectedStudentForEnroll.class_name}
                      </p>
                    </div>
                  </div>

                  {selectedStudentForEnroll.is_enrolled && (
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#3F8F72] bg-[#EAF5F0] px-2.5 py-1 rounded-lg border border-[#3F8F72]/20">
                        Template Active ({selectedStudentForEnroll.sample_count} samples)
                      </span>
                      <p className="text-[10px] text-[#A8A29E] mt-1">
                        Enrolled: {selectedStudentForEnroll.enrolled_at ? new Date(selectedStudentForEnroll.enrolled_at).toLocaleDateString() : 'Active'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Enrollment Camera Preview Box */}
                <div className="relative bg-black rounded-2xl overflow-hidden aspect-16/9 flex items-center justify-center border border-[#E7E5E4]">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {!isCameraActive ? (
                    <div className="text-center text-white/90 p-6 max-w-md z-10">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-2 text-white/70">
                        <CameraOff className="w-6 h-6" />
                      </div>
                      <p className="text-xs mb-3 text-slate-300">Start a physical webcam to capture three samples of the consenting student.</p>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          onClick={startCamera}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                        >
                          Start Webcam
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-48 h-56 border-2 border-dashed border-[#3F8F72] rounded-3xl flex items-center justify-center">
                        <span className="text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded backdrop-blur-sm">
                          Keep Face Centered
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sample Capture Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleCaptureSample}
                      disabled={!isCameraActive || capturedSamples.length >= 3}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isCameraActive && capturedSamples.length < 3
                          ? 'bg-[#3F8F72] text-white hover:bg-[#347A60]'
                          : 'bg-[#E7E5E4] text-[#A8A29E] cursor-not-allowed'
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                      <span>Capture Face Sample ({capturedSamples.length}/3)</span>
                    </button>

                    {capturedSamples.length > 0 && (
                      <button
                        onClick={() => setCapturedSamples([])}
                        className="text-xs font-medium text-[#78716C] hover:text-[#292524] px-3 py-2 cursor-pointer"
                      >
                        Reset Samples
                      </button>
                    )}
                  </div>

                  {isCameraActive && (
                    <button
                      onClick={stopCamera}
                      className="text-xs text-[#78716C] hover:text-[#292524] px-3 py-1.5 rounded-lg bg-[#F5F5F4] cursor-pointer"
                    >
                      Stop Camera
                    </button>
                  )}
                </div>

                {/* Captured Sample Summary */}
                {capturedSamples.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#78716C]">Captured Face Samples:</label>
                    <div className="flex flex-wrap gap-2">
                      {capturedSamples.map((_, idx) => (
                        <div key={idx} className="flex items-center gap-2 rounded-full border border-[#3F8F72]/30 bg-[#EAF5F0] px-2.5 py-1 text-[10px] font-semibold text-[#1B4332]">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#3F8F72] text-white text-[9px]">{idx + 1}</span>
                          Ready
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Privacy & Legal Consent Checkbox */}
                <div className="bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl p-4 space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentGranted}
                      onChange={e => setConsentGranted(e.target.checked)}
                      className="mt-0.5 rounded text-[#3F8F72] focus:ring-[#3F8F72] cursor-pointer"
                    />
                    <span className="text-xs text-[#57534E]">
                      <strong>Informed Biometric Consent:</strong> I confirm that the student/legal guardian has consented to facial biometric template generation for attendance verification. Camera frames are processed locally and discarded; only an encrypted face template is retained. This model does not detect liveness or prevent photo replay.
                    </span>
                  </label>
                </div>

                {/* Feedback Message */}
                {enrollMessage && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                      enrollMessage.type === 'success'
                        ? 'bg-[#EAF5F0] border-[#3F8F72]/30 text-[#1B4332]'
                        : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                    }`}
                  >
                    {enrollMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-[#3F8F72] shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
                    )}
                    <span>{enrollMessage.text}</span>
                  </div>
                )}

                {/* Submit Enrollment Button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={handleSubmitEnrollment}
                    disabled={enrollSubmitting || !consentGranted || !BIOMETRIC_ENROLLMENT_AVAILABLE}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                      consentGranted && !enrollSubmitting && BIOMETRIC_ENROLLMENT_AVAILABLE
                        ? 'bg-[#3F8F72] hover:bg-[#347A60] text-white'
                        : 'bg-[#E7E5E4] text-[#A8A29E] cursor-not-allowed'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{enrollSubmitting ? 'Registering Template...' : 'Enroll Face Samples'}</span>
                  </button>
                </div>

              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#E7E5E4] p-12 text-center text-[#78716C] shadow-sm space-y-2">
                <Users className="w-12 h-12 mx-auto text-[#A8A29E] stroke-[1.5]" />
                <h3 className="text-sm font-bold text-[#292524]">No Student Selected</h3>
                <p className="text-xs text-[#78716C] max-w-sm mx-auto">
                  Please select a student from the list on the left to capture camera samples and generate their facial biometric template.
                </p>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
