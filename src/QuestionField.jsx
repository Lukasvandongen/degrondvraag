import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

// Design seed 7319. A question holds its shape, yields to a visitor, and reforms.
// A local particle system: no global pointer replacement or animation dependency.
const SEED = 7319;

export default function QuestionField({ language }) {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const [paused, setPaused] = useState(() => {
    const preference = sessionStorage.getItem("dgq:motion");
    return preference
      ? preference === "paused"
      : window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(pointer: fine)");
    const pointer = { x: -1000, y: -1000, active: false };
    let particles = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    let last = 0;
    let elapsed = 0;
    let randomState = SEED;
    const random = () => {
      randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
      return randomState / 4294967296;
    };

    const draw = (time) => {
      frame = 0;
      const animate = !paused;
      const delta = Math.min((time - last) / 16.667 || 1, 2);
      last = time;
      if (animate) elapsed += delta * 0.008;
      context.clearRect(0, 0, width, height);
      for (const point of particles) {
        const drift = animate ? Math.sin(elapsed + point.phase) * 1.8 : 0;
        let targetX = point.homeX + drift;
        let targetY =
          point.homeY +
          (animate ? Math.cos(elapsed * 0.7 + point.phase) * 1.3 : 0);
        const dx = point.homeX - pointer.x;
        const dy = point.homeY - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (animate && pointer.active && distance < 115) {
          const force = (1 - distance / 115) ** 2 * 80;
          targetX += (dx / (distance || 1)) * force;
          targetY += (dy / (distance || 1)) * force;
        }
        const ease = animate ? 1 - Math.pow(0.87, delta) : 1;
        point.x += (targetX - point.x) * ease;
        point.y += (targetY - point.y) * ease;
        const shimmer = animate
          ? Math.sin(elapsed * 0.8 + point.phase) * 0.12
          : 0;
        context.fillStyle = `rgba(225,225,225,${point.alpha + shimmer})`;
        context.beginPath();
        context.arc(point.x, point.y, point.size, 0, Math.PI * 2);
        context.fill();
      }
      if (visible && !document.hidden && animate)
        frame = requestAnimationFrame(draw);
    };
    const schedule = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      last = performance.now();
      // A paused canvas still needs a fresh frame when resizing clears its
      // backing buffer, including while visibility observers are settling.
      if (paused) draw(last);
      else if (visible && !document.hidden) frame = requestAnimationFrame(draw);
    };
    const resize = () => {
      const bounds = stage.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      randomState = SEED;
      particles = [];
      // Rasterise one drawn glyph into a reproducible point field. Keep its
      // proportions independent of webfont loading and of device pixel ratio.
      const mask = document.createElement("canvas");
      mask.width = 400;
      mask.height = 440;
      const ink = mask.getContext("2d", { willReadFrequently: true });
      ink.strokeStyle = "white";
      ink.lineWidth = 53;
      ink.lineCap = "butt";
      ink.beginPath();
      ink.moveTo(103, 142);
      ink.bezierCurveTo(103, 39, 291, 29, 291, 140);
      ink.bezierCurveTo(291, 208, 199, 207, 199, 279);
      ink.lineTo(199, 296);
      ink.stroke();
      ink.fillStyle = "white";
      ink.fillRect(173, 347, 53, 53);
      const pixels = ink.getImageData(0, 0, 400, 440).data;
      const scale = Math.min(width / 420, height / 460);
      for (let y = 0; y < 440; y += 5) {
        for (let x = 0; x < 400; x += 5) {
          if (pixels[(y * 400 + x) * 4 + 3] < 128) continue;
          const homeX = width / 2 + (x - 200) * scale;
          const homeY = height / 2 + (y - 220) * scale;
          particles.push({
            homeX,
            homeY,
            x: homeX,
            y: homeY,
            phase: random() * Math.PI * 2,
            alpha: 0.3 + random() * 0.55,
            size: (0.65 + random() * 0.65) * Math.max(scale, 0.75),
          });
        }
      }
      schedule();
    };
    const move = (event) => {
      if (!fine.matches) return;
      const bounds = stage.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = true;
    };
    const leave = () => {
      pointer.active = false;
    };
    const resizeObserver = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      schedule();
    });
    resizeObserver.observe(stage);
    intersection.observe(stage);
    stage.addEventListener("pointermove", move, { passive: true });
    stage.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", schedule);
    const preferenceChanged = () => {
      if (!sessionStorage.getItem("dgq:motion")) setPaused(motion.matches);
    };
    motion.addEventListener("change", preferenceChanged);
    resize();
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", schedule);
      motion.removeEventListener("change", preferenceChanged);
    };
  }, [paused]);

  return (
    <div className="question-field" ref={stageRef}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <span className="question-hint" aria-hidden="true">
        {language === "nl" ? "Raak de vraag aan." : "Touch the question."}
      </span>
      <button
        className="motion-control"
        onClick={() => {
          sessionStorage.setItem("dgq:motion", paused ? "enabled" : "paused");
          setPaused(!paused);
        }}
        aria-label={
          language === "nl"
            ? paused
              ? "Animatie hervatten"
              : "Animatie pauzeren"
            : paused
              ? "Resume animation"
              : "Pause animation"
        }
        aria-pressed={paused}
      >
        {paused ? <Play size={13} /> : <Pause size={13} />}
      </button>
    </div>
  );
}
