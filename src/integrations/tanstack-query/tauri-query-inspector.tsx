import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function TauriQueryInspector() {
	const queryClient = useQueryClient();
	const [isOpen, setIsOpen] = useState(false);
	const [queries, setQueries] = useState<any[]>([]);

	// Subscribe to TanStack Query cache updates in real-time
	useEffect(() => {
		const cache = queryClient.getQueryCache();

		const updateQueries = () => {
			setQueries(
				cache.getAll().map((q) => ({
					rawQuery: q,
					keyArray: q.queryKey,
					keyStr: JSON.stringify(q.queryKey),
					status: q.state.status,
					isFetching: q.state.fetchStatus === "fetching",
					updatedAt: new Date(q.state.dataUpdatedAt).toLocaleTimeString(),
					data: q.state.data,
					error: q.state.error,
				})),
			);
		};

		updateQueries();
		return cache.subscribe(updateQueries);
	}, [queryClient]);

	if (process.env.NODE_ENV !== "development") return null;

	return (
		<div
			style={{
				position: "fixed",
				bottom: 12,
				right: 12,
				zIndex: 99999,
				fontFamily: "monospace",
			}}
		>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				style={{
					padding: "8px 14px",
					background: "#FF4154",
					color: "#fff",
					border: "none",
					borderRadius: "6px",
					cursor: "pointer",
					fontWeight: "bold",
					boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
				}}
			>
				{isOpen ? "✕ Close Query Dev" : "⚡ Queries (" + queries.length + ")"}
			</button>

			{isOpen && (
				<div
					style={{
						position: "fixed",
						bottom: 52,
						right: 12,
						width: "600px",
						maxHeight: "500px",
						background: "#1a1a1a",
						color: "#eee",
						border: "1px solid #333",
						borderRadius: "8px",
						padding: "12px",
						overflowY: "auto",
						boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
					}}
				>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: 12,
						}}
					>
						<strong style={{ color: "#FF4154" }}>
							TanStack Query Dev Tools
						</strong>
						<button
							type="button"
							onClick={() => queryClient.invalidateQueries()}
							style={{
								background: "#374151",
								color: "#fff",
								border: "none",
								padding: "4px 8px",
								borderRadius: "4px",
								cursor: "pointer",
								fontSize: "11px",
							}}
						>
							⚠️ Invalidate All
						</button>
					</div>

					{queries.length === 0 && (
						<p style={{ color: "#888" }}>No active queries mounted in cache.</p>
					)}

					{queries.map((q) => (
						<div
							key={q.keyStr}
							style={{
								background: "#242424",
								padding: "10px",
								borderRadius: "6px",
								marginBottom: "8px",
								borderLeft: `4px solid ${
									q.isFetching
										? "#3B82F6"
										: q.status === "success"
											? "#10B981"
											: q.status === "error"
												? "#EF4444"
												: "#F59E0B"
								}`,
							}}
						>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									fontSize: "12px",
									marginBottom: "6px",
								}}
							>
								<span
									style={{
										fontWeight: "bold",
										color: "#60A5FA",
										wordBreak: "break-all",
									}}
								>
									{q.keyStr}
								</span>
								<span
									style={{
										color: "#888",
										whiteSpace: "nowrap",
										marginLeft: "8px",
									}}
								>
									{q.updatedAt}
								</span>
							</div>

							<div
								style={{ fontSize: "11px", color: "#aaa", marginBottom: "8px" }}
							>
								Status: <b>{q.status}</b>{" "}
								{q.isFetching && (
									<span style={{ color: "#60A5FA" }}>🔄 Fetching...</span>
								)}
							</div>

							{/* Action Toolbar */}
							<div
								style={{
									display: "flex",
									gap: "6px",
									flexWrap: "wrap",
									marginBottom: "8px",
								}}
							>
								<button
									onClick={() =>
										queryClient.refetchQueries({ queryKey: q.keyArray })
									}
									style={{
										background: "#2563EB",
										color: "#fff",
										border: "none",
										padding: "3px 8px",
										borderRadius: "3px",
										fontSize: "10px",
										cursor: "pointer",
									}}
								>
									🔄 Refetch
								</button>

								<button
									onClick={() =>
										queryClient.invalidateQueries({ queryKey: q.keyArray })
									}
									style={{
										background: "#D97706",
										color: "#fff",
										border: "none",
										padding: "3px 8px",
										borderRadius: "3px",
										fontSize: "10px",
										cursor: "pointer",
									}}
								>
									⚠️ Invalidate
								</button>

								<button
									onClick={() =>
										queryClient.resetQueries({ queryKey: q.keyArray })
									}
									style={{
										background: "#4B5563",
										color: "#fff",
										border: "none",
										padding: "3px 8px",
										borderRadius: "3px",
										fontSize: "10px",
										cursor: "pointer",
									}}
								>
									↺ Reset
								</button>

								<button
									onClick={() =>
										queryClient.removeQueries({ queryKey: q.keyArray })
									}
									style={{
										background: "#DC2626",
										color: "#fff",
										border: "none",
										padding: "3px 8px",
										borderRadius: "3px",
										fontSize: "10px",
										cursor: "pointer",
									}}
								>
									🗑️ Remove
								</button>
							</div>

							{/* Collapsible Output */}
							<details style={{ fontSize: "11px" }}>
								<summary style={{ cursor: "pointer", color: "#9CA3AF" }}>
									View Data / Error
								</summary>
								<pre
									style={{
										background: "#111",
										padding: "8px",
										borderRadius: "4px",
										maxHeight: "150px",
										overflow: "auto",
										margin: "6px 0 0 0",
										color: q.error ? "#FCA5A5" : "#A7F3D0",
									}}
								>
									{JSON.stringify(q.data ?? q.error, null, 2)}
								</pre>
							</details>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
