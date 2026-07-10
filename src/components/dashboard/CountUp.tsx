import { useEffect, useRef } from "react";
import { animate, useMotionValue, useTransform, motion } from "framer-motion";

export function CountUp({
  value,
  format = (n: number) => Math.round(n).toLocaleString("en-IN"),
  className,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const motionVal = useMotionValue(0);
  const display = useTransform(motionVal, format);
  const prev = useRef(0);

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration: 0.8,
      ease: [0.4, 0, 0.2, 1],
    });
    prev.current = value;
    return controls.stop;
  }, [value, motionVal]);

  return <motion.span className={className}>{display}</motion.span>;
}
