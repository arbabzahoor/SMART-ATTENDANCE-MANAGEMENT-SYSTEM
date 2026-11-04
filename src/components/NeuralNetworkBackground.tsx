import { useEffect, useRef } from 'react';

interface NetworkNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Pulse {
  from: number;
  to: number;
  offset: number;
  speed: number;
}

export const NeuralNetworkBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0;
    let height = 0;
    let nodes: NetworkNode[] = [];
    let pulses: Pulse[] = [];
    let animationFrame = 0;
    let lastFrame = 0;
    let isDark = document.documentElement.dataset.theme === 'dark';

    const colors = () => isDark
      ? { line: '96, 165, 250', glow: '56, 189, 248', accent: '167, 139, 250' }
      : { line: '37, 99, 235', glow: '59, 130, 246', accent: '99, 102, 241' };

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const area = width * height;
      const density = width < 640 ? 15000 : width < 1024 ? 12500 : 10500;
      const nodeCount = Math.max(width < 640 ? 24 : 34, Math.min(105, Math.round(area / density)));
      nodes = Array.from({ length: nodeCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.24,
        vy: (Math.random() - 0.5) * 0.24,
        radius: Math.random() * 1.4 + 1,
      }));
      pulses = Array.from({ length: Math.max(3, Math.round(nodeCount / 24)) }, () => {
        const from = Math.floor(Math.random() * nodeCount);
        const source = nodes[from];
        const nearest = nodes
          .map((node, index) => ({
            index,
            distance: Math.hypot(node.x - source.x, node.y - source.y),
          }))
          .filter(candidate => candidate.index !== from && candidate.distance < (width < 640 ? 115 : 155))
          .sort((first, second) => first.distance - second.distance)[0];
        const to = nearest?.index ?? (from + 1) % nodeCount;

        return {
          from: Math.min(from, to),
          to: Math.max(from, to),
          offset: Math.random(),
          speed: 0.0003 + Math.random() * 0.0003,
        };
      });
      draw(0, false);
    };

    const draw = (time: number, animate: boolean) => {
      context.clearRect(0, 0, width, height);
      const palette = colors();
      const maxDistance = width < 640 ? 115 : 155;

      if (animate) {
        for (const node of nodes) {
          node.x += node.vx;
          node.y += node.vy;
          if (node.x < -8 || node.x > width + 8) node.vx *= -1;
          if (node.y < -8 || node.y > height + 8) node.vy *= -1;
        }
      }

      context.lineWidth = 0.7;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const first = nodes[i];
          const second = nodes[j];
          const dx = second.x - first.x;
          const dy = second.y - first.y;
          const distance = Math.hypot(dx, dy);
          if (distance >= maxDistance) continue;

          const opacity = (1 - distance / maxDistance) * (isDark ? 0.2 : 0.14);
          context.strokeStyle = `rgba(${palette.line}, ${opacity})`;
          context.beginPath();
          context.moveTo(first.x, first.y);
          context.lineTo(second.x, second.y);
          context.stroke();

          const pulse = animate
            ? pulses.find(candidate => candidate.from === i && candidate.to === j)
            : undefined;
          if (pulse) {
            const progress = (pulse.offset + time * pulse.speed) % 1;
            const px = first.x + dx * progress;
            const py = first.y + dy * progress;
            context.fillStyle = `rgba(${palette.accent}, ${0.3 + opacity})`;
            context.beginPath();
            context.arc(px, py, 1.5, 0, Math.PI * 2);
            context.fill();
          }
        }
      }

      for (let index = 0; index < nodes.length; index++) {
        const node = nodes[index];
        const glow = 0.45 + Math.sin(time * 0.001 + index) * 0.15;
        context.shadowBlur = isDark ? 9 : 7;
        context.shadowColor = `rgba(${palette.glow}, ${glow})`;
        context.fillStyle = `rgba(${index % 5 === 0 ? palette.accent : palette.glow}, ${isDark ? 0.72 : 0.52})`;
        context.beginPath();
        context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        context.fill();
      }
      context.shadowBlur = 0;
    };

    const render = (time: number) => {
      animationFrame = 0;
      if (document.hidden) return;
      if (!motionPreference.matches && time - lastFrame < 32) {
        animationFrame = window.requestAnimationFrame(render);
        return;
      }
      lastFrame = time;
      draw(time, !motionPreference.matches);
      if (!motionPreference.matches) animationFrame = window.requestAnimationFrame(render);
    };

    const start = () => {
      if (!document.hidden && !animationFrame) {
        animationFrame = window.requestAnimationFrame(render);
      }
    };

    const stop = () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    };

    const handleVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    const handleMotionPreference = () => {
      stop();
      draw(0, false);
      start();
    };

    const themeObserver = new MutationObserver(() => {
      isDark = document.documentElement.dataset.theme === 'dark';
      draw(0, false);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);
    motionPreference.addEventListener('change', handleMotionPreference);
    resize();
    start();

    return () => {
      stop();
      themeObserver.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
      motionPreference.removeEventListener('change', handleMotionPreference);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="neural-network-background"
    />
  );
};
