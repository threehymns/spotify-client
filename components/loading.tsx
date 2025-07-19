import React from "react";

/**
 * Loading: A universal loading spinner for use throughout the app.
 * Optional props: text (string) for a loading message, className for custom styling.
 */
export default function Loading({
	text = "Loading...",
	className = "",
}: {
	text?: string;
	className?: string;
}) {
	return (
		<div
			className={`flex flex-col items-center justify-center py-8 ${className}`}
			role="status"
			aria-live="polite"
		>
			<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
			<span className="text-zinc-400 text-base font-medium">{text}</span>
		</div>
	);
}
