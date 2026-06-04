import {
  Cake,
  Candy,
  Cherry,
  Coffee,
  Cookie,
  Croissant,
  CupSoda,
  IceCream,
  IceCreamCone,
  Milk,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";

const FOOD_ICONS = [
  Cake,
  Coffee,
  Cookie,
  IceCream,
  IceCreamCone,
  Cherry,
  Croissant,
  Candy,
  CupSoda,
  Milk,
  Sparkles,
];

export function IngredientsFloatingBg() {
  const items = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => {
        const Icon = FOOD_ICONS[i % FOOD_ICONS.length];
        return {
          Icon,
          left: `${(i * 13.7 + 2) % 96}%`,
          top: `${(i * 19.3 + 4) % 92}%`,
          size: 14 + (i % 5) * 7,
          opacity: 0.06 + (i % 4) * 0.035,
          delay: (i % 9) * 0.45,
          duration: 7 + (i % 7) * 1.8,
          driftX: ((i % 5) - 2) * 14,
          driftY: -18 - (i % 6) * 6,
          rotate: (i % 8) * 18 - 28,
        };
      }),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {items.map((item, i) => (
        <motion.div
          key={i}
          className="absolute text-primary"
          style={{
            left: item.left,
            top: item.top,
            opacity: item.opacity,
          }}
          animate={{
            y: [0, item.driftY, 0],
            x: [0, item.driftX, 0],
            rotate: [item.rotate, item.rotate + 20, item.rotate - 10, item.rotate],
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            delay: item.delay,
            ease: "easeInOut",
          }}
        >
          <item.Icon style={{ width: item.size, height: item.size }} strokeWidth={1.5} />
        </motion.div>
      ))}
    </div>
  );
}
