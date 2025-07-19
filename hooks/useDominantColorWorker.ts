import { useEffect, useRef, useState } from "react";

export function useDominantColorWorker(
	id: string | undefined,
	imageUrl: string | undefined,
) {
	const [color, setColor] = useState<number[] | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const workerRef = useRef<Worker | null>(null);

	useEffect(() => {
		if (!id || !imageUrl) return;

		// Check localStorage for cached color
		const cached = localStorage.getItem(`dominant-color-${id}`);
		if (cached) {
			try {
				const parsed = JSON.parse(cached);
				if (Array.isArray(parsed) && parsed.length === 3) {
					setColor(parsed);
					setLoading(false);
					setError(null);
					return;
				}
			} catch {}
		}

		setLoading(true);
		setColor(null);
		setError(null);

		if (!workerRef.current) {
			workerRef.current = new Worker(
				new URL("../utils/dominant-color-worker.ts", import.meta.url),
				{ type: "module" },
			);
		}
		const worker = workerRef.current;

		worker.onmessage = (event: MessageEvent) => {
			const { success, color, error: workerError, id: returnedId } = event.data;
			if (success) {
				setColor(color);
				setError(null);
				// Save to localStorage
				if (returnedId && Array.isArray(color) && color.length === 3) {
					localStorage.setItem(
						`dominant-color-${returnedId}`,
						JSON.stringify(color),
					);
				}
			} else {
				setColor(null);
				setError(workerError || "Failed to extract color");
			}
			setLoading(false);
		};

		worker.onerror = (err) => {
			setError(err.message || "Worker error");
			setColor(null);
			setLoading(false);
		};

		worker.postMessage({ id, imageUrl });

		// Optionally terminate and recreate worker per image
		// return () => {
		//   worker.terminate();
		//   workerRef.current = null;
		// };
	}, [id, imageUrl]);

	return { color, loading, error };
}
