import * as React from "react";
import { motion } from "motion/react";
import Image, { type ImageProps } from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Forward ref for React 18 compatibility
const AlbumArt = React.forwardRef<HTMLImageElement, ImageProps>((props, ref) => {
  // Remove layoutId from props to avoid Next.js Image warning
  // We'll spread the rest
  const { ...rest } = props;
  return <Image ref={ref} {...rest} />;
});
AlbumArt.displayName = "AlbumArt";

const MotionAlbumArt = motion.create(AlbumArt);
export default MotionAlbumArt;

const MotionButton = motion.create(Button);
export { MotionButton };

const MotionLink = motion.create(Link);
export { MotionLink };
