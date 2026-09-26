import { type Query, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

export function TauriQueryInspector() {
	const queryClient = useQueryClient();
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [queries, setQueries] = useState<any[]>([]);
	const [selectedKey, setSelectedKey] = useState<string | null>(null);

	// Advanced: Inline mock data overriding
	const [mockInput, setMockInput] = useState("");
	const [showMockEditor, setShowMockEditor] = useState(false);

	// Real-time subscription to the Query Cache
	useEffect(() => {
		const cache = queryClient.getQueryCache();

		const updateQueries = () => {
			setQueries(
				cache.getAll().map((q: Query<any, any, any>) => {
					const isStale = q.isStale();
					const isFetching = q.state.fetchStatus === "fetching";
					const isPaused = q.state.fetchStatus === "paused";
					const observerCount = q.getObserversCount();
					const isInactive = observerCount === 0;

					let stateTag = "fresh";
					let stateColor = "#10B981"; // Green

					if (isInactive) {
						stateTag = "inactive";
						stateColor = "#6B7280"; // Gray
					} else if (isFetching) {
						stateTag = "fetching";
						stateColor = "#3B82F6"; // Blue
					} else if (isPaused) {
						stateTag = "paused";
						stateColor = "#F59E0B"; // Orange
					} else if (isStale) {
						stateTag = "stale";
						stateColor = "#F59E0B"; // Yellow
					}

					return {
						queryInstance: q,
						keyArray: q.queryKey,
						keyHash: q.queryHash,
						keyStr: JSON.stringify(q.queryKey),
						stateTag,
						stateColor,
						isStale,
						isFetching,
						isInactive,
						observerCount,
						dataUpdatedAt: q.state.dataUpdatedAt
							? new Date(q.state.dataUpdatedAt).toLocaleTimeString()
							: "Never",
						errorUpdatedAt: q.state.errorUpdatedAt
							? new Date(q.state.errorUpdatedAt).toLocaleTimeString()
							: "Never",
						fetchFailureCount: q.state.fetchFailureCount,
						status: q.state.status,
						fetchStatus: q.state.fetchStatus,
						data: q.state.data,
						error: q.state.error,
						options: q.options, // Extracted meta options (staleTime, gcTime, etc.)
					};
				}),
			);
		};

		updateQueries();
		return cache.subscribe(updateQueries);
	}, [queryClient]);

	// Filter queries based on search
	const filteredQueries = useMemo(() => {
		if (!search) return queries;
		return queries.filter((q) =>
			q.keyStr.toLowerCase().includes(search.toLowerCase()),
		);
	}, [queries, search]);

	const selectedQuery =
		queries.find((q) => q.keyStr === selectedKey) || filteredQueries[0];

	// Advanced feature: Safely inject custom JSON data into the cache
	const handleInjectMockData = () => {
		if (!selectedQuery) return;
		try {
			const parsed = JSON.parse(mockInput);
			queryClient.setQueryData(selectedQuery.keyArray, parsed);
			setShowMockEditor(false);
			setMockInput("");
		} catch {
			alert("Invalid JSON! Check your syntax.");
		}
	};

	// Copy to clipboard helper
	const copyToClipboard = (data: any) => {
		navigator.clipboard
			.writeText(JSON.stringify(data, null, 2))
			.then(() => alert("Copied to clipboard!"));
	};

	if (process.env.NODE_ENV !== "development") return null;

	return (
		<div
			style={{
				position: "fixed",
				bottom: 12,
				left: 12,
				zIndex: 99999,
				fontFamily: "monospace",
			}}
		>
			<button
	type="button"
				onClick={() => setIsOpen(!isOpen)}
				style={{
					padding: "10px 16px",
					background: "#0ea5e9",
					color: "#fff",
					border: "1px solid #0284c7",
					borderRadius: "8px",
					cursor: "pointer",
					fontWeight: "bold",
					boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
					display: "flex",
					alignItems: "center",
					gap: "8px",
				}}
			>
				{isOpen
					? "✕ Close DevTools"
					: `🛸 God-Mode Query Inspector (${queries.length})`}
			</button>

			{isOpen && (
				<div
					style={{
						position: "fixed",
						bottom: 60,
						left: 12,
						width: "95vw",
						maxWidth: "1000px",
						height: "600px",
						background: "#0c0c0c",
						color: "#E5E7EB",
						border: "1px solid #27272A",
						borderRadius: "12px",
						display: "flex",
						flexDirection: "column",
						boxShadow: "0 16px 40px rgba(0,0,0,0.8)",
						overflow: "hidden",
					}}
				>
					{/* Header Bar */}
					<div
						style={{
							padding: "12px 16px",
							background: "#18181B",
							borderBottom: "1px solid #27272A",
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<input
							type="text"
							placeholder="🔍 Filter keys..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							style={{
								background: "#09090B",
								border: "1px solid #3F3F46",
								color: "#fff",
								padding: "6px 12px",
								borderRadius: "6px",
								width: "250px",
								fontFamily: "monospace",
							}}
						/>
						<div style={{ display: "flex", gap: "8px" }}>
							<button
	type="button"
								onClick={() => queryClient.clear()}
								style={{
									background: "#7f1d1d",
									color: "#fff",
									border: "none",
									padding: "6px 12px",
									borderRadius: "4px",
									cursor: "pointer",
								}}
							>
								☢️ Nuke Cache
							</button>
							<button
	type="button"
								onClick={() => queryClient.invalidateQueries()}
								style={{
									background: "#27272A",
									color: "#fff",
									border: "1px solid #3F3F46",
									padding: "6px 12px",
									borderRadius: "4px",
									cursor: "pointer",
								}}
							>
								⚠️ Invalidate All
							</button>
						</div>
					</div>

					{/* Main Workspace */}
					<div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
						{/* Left Sidebar: Query List */}
						<div
							style={{
								width: "350px",
								borderRight: "1px solid #27272A",
								overflowY: "auto",
								background: "#09090B",
							}}
						>
							{filteredQueries.map((q) => {
								const isSelected = selectedQuery?.keyStr === q.keyStr;
								return (
									<div
										key={q.keyHash}
										onClick={() => {
											setSelectedKey(q.keyStr);
											setShowMockEditor(false);
										}}
										style={{
											padding: "12px",
											borderBottom: "1px solid #18181B",
											cursor: "pointer",
											background: isSelected ? "#27272A" : "transparent",
											borderLeft: `4px solid ${q.stateColor}`,
										}}
									>
										<div
											style={{
												fontSize: "12px",
												fontWeight: "bold",
												color: isSelected ? "#fff" : "#d4d4d8",
												wordBreak: "break-all",
												marginBottom: "6px",
											}}
										>
											{q.keyStr}
										</div>
										<div
											style={{ display: "flex", gap: "8px", fontSize: "10px" }}
										>
											<span
												style={{
													background: q.stateColor,
													color: "#000",
													padding: "2px 6px",
													borderRadius: "4px",
													fontWeight: "bold",
													textTransform: "uppercase",
												}}
											>
												{q.stateTag}
											</span>
											<span
												style={{
													color: "#71717A",
													background: "#18181B",
													padding: "2px 6px",
													borderRadius: "4px",
												}}
											>
												👁️ {q.observerCount}
											</span>
											<span
												style={{
													color: "#71717A",
													background: "#18181B",
													padding: "2px 6px",
													borderRadius: "4px",
												}}
											>
												{q.status}
											</span>
										</div>
									</div>
								);
							})}
						</div>

						{/* Right Panel: Detailed View */}
						{selectedQuery ? (
							<div
								style={{
									flex: 1,
									padding: "20px",
									overflowY: "auto",
									background: "#121212",
								}}
							>
								{/* Advanced Actions Toolbar */}
								<div
									style={{
										display: "flex",
										gap: "8px",
										flexWrap: "wrap",
										marginBottom: "20px",
										background: "#18181B",
										padding: "12px",
										borderRadius: "8px",
										border: "1px solid #27272A",
									}}
								>
									<button
	type="button"
										onClick={() =>
											queryClient.refetchQueries({
												queryKey: selectedQuery.keyArray,
											})
										}
										style={{
											background: "#0284c7",
											color: "#fff",
											border: "none",
											padding: "6px 12px",
											borderRadius: "6px",
											cursor: "pointer",
											fontWeight: "bold",
										}}
									>
										🔄 Refetch
									</button>

									<button
	type="button"
										onClick={() =>
											queryClient.invalidateQueries({
												queryKey: selectedQuery.keyArray,
											})
										}
										style={{
											background: "#d97706",
											color: "#fff",
											border: "none",
											padding: "6px 12px",
											borderRadius: "6px",
											cursor: "pointer",
											fontWeight: "bold",
										}}
									>
										⚠️ Invalidate (Refetch)
									</button>

									{/* Silent Stale: Marks it stale in the cache without triggering an immediate active refetch */}
									<button
	type="button"
										onClick={() =>
											queryClient.invalidateQueries({
												queryKey: selectedQuery.keyArray,
												refetchType: "none",
											})
										}
										style={{
											background: "#854d0e",
											color: "#fff",
											border: "none",
											padding: "6px 12px",
											borderRadius: "6px",
											cursor: "pointer",
											fontWeight: "bold",
										}}
									>
										🍂 Make Stale (Silent)
									</button>

									<button
	type="button"
										onClick={() =>
											queryClient.resetQueries({
												queryKey: selectedQuery.keyArray,
											})
										}
										style={{
											background: "#4b5563",
											color: "#fff",
											border: "none",
											padding: "6px 12px",
											borderRadius: "6px",
											cursor: "pointer",
											fontWeight: "bold",
										}}
									>
										↺ Reset
									</button>

									<button
	type="button"
										onClick={() => {
											setMockInput(
												JSON.stringify(selectedQuery.data || {}, null, 2),
											);
											setShowMockEditor(!showMockEditor);
										}}
										style={{
											background: "#10b981",
											color: "#fff",
											border: "none",
											padding: "6px 12px",
											borderRadius: "6px",
											cursor: "pointer",
											fontWeight: "bold",
										}}
									>
										💉 Inject Data
									</button>

									<button
	type="button"
										onClick={() =>
											queryClient.removeQueries({
												queryKey: selectedQuery.keyArray,
											})
										}
										style={{
											background: "#dc2626",
											color: "#fff",
											border: "none",
											padding: "6px 12px",
											borderRadius: "6px",
											cursor: "pointer",
											fontWeight: "bold",
										}}
									>
										🗑️ Remove
									</button>
								</div>

								{/* Mock Data Injector */}
								{showMockEditor && (
									<div
										style={{
											background: "#0f172a",
											padding: "12px",
											borderRadius: "8px",
											border: "1px solid #1e293b",
											marginBottom: "20px",
										}}
									>
										<div
											style={{
												color: "#38bdf8",
												marginBottom: "8px",
												fontWeight: "bold",
											}}
										>
											Override Cache Data (JSON)
										</div>
										<textarea
											value={mockInput}
											onChange={(e) => setMockInput(e.target.value)}
											style={{
												width: "100%",
												height: "150px",
												background: "#020617",
												color: "#a5f3fc",
												border: "1px solid #334155",
												padding: "12px",
												borderRadius: "6px",
												fontFamily: "monospace",
											}}
										/>
										<button
	type="button"
											onClick={handleInjectMockData}
											style={{
												background: "#0284c7",
												color: "#fff",
												border: "none",
												padding: "6px 16px",
												borderRadius: "4px",
												marginTop: "8px",
												cursor: "pointer",
											}}
										>
											Save to Cache
										</button>
									</div>
								)}

								{/* Deep Configuration Grid */}
								<div
									style={{
										display: "grid",
										gridTemplateColumns: "repeat(3, 1fr)",
										gap: "12px",
										fontSize: "11px",
										marginBottom: "20px",
									}}
								>
									<div
										style={{
											background: "#18181B",
											padding: "12px",
											borderRadius: "6px",
											border: "1px solid #27272A",
										}}
									>
										<div style={{ color: "#71717A", marginBottom: "4px" }}>
											staleTime
										</div>
										<div style={{ color: "#fff", fontWeight: "bold" }}>
											{selectedQuery.options.staleTime === Infinity
												? "Infinity"
												: selectedQuery.options.staleTime || "0"}{" "}
											ms
										</div>
									</div>
									<div
										style={{
											background: "#18181B",
											padding: "12px",
											borderRadius: "6px",
											border: "1px solid #27272A",
										}}
									>
										<div style={{ color: "#71717A", marginBottom: "4px" }}>
											gcTime (Cache Life)
										</div>
										<div style={{ color: "#fff", fontWeight: "bold" }}>
											{selectedQuery.options.gcTime === Infinity
												? "Infinity"
												: selectedQuery.options.gcTime || "300000"}{" "}
											ms
										</div>
									</div>
									<div
										style={{
											background: "#18181B",
											padding: "12px",
											borderRadius: "6px",
											border: "1px solid #27272A",
										}}
									>
										<div style={{ color: "#71717A", marginBottom: "4px" }}>
											Retry Logic
										</div>
										<div style={{ color: "#fff", fontWeight: "bold" }}>
											{selectedQuery.options.retry === false
												? "Disabled"
												: (selectedQuery.options.retry ?? "Default (3)")}
										</div>
									</div>
									<div
										style={{
											background: "#18181B",
											padding: "12px",
											borderRadius: "6px",
											border: "1px solid #27272A",
										}}
									>
										<div style={{ color: "#71717A", marginBottom: "4px" }}>
											Data Updated
										</div>
										<div style={{ color: "#fff" }}>
											{selectedQuery.dataUpdatedAt}
										</div>
									</div>
									<div
										style={{
											background: "#18181B",
											padding: "12px",
											borderRadius: "6px",
											border: "1px solid #27272A",
										}}
									>
										<div style={{ color: "#71717A", marginBottom: "4px" }}>
											Failures
										</div>
										<div
											style={{
												color:
													selectedQuery.fetchFailureCount > 0
														? "#ef4444"
														: "#fff",
												fontWeight: "bold",
											}}
										>
											{selectedQuery.fetchFailureCount}
										</div>
									</div>
								</div>

								{/* Data Explorer */}
								<div>
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											marginBottom: "8px",
										}}
									>
										<div style={{ fontWeight: "bold", color: "#a1a1aa" }}>
											Cached Data Payload
										</div>
										<button
	type="button"
											onClick={() =>
												copyToClipboard(
													selectedQuery.data || selectedQuery.error,
												)
											}
											style={{
												background: "transparent",
												color: "#0ea5e9",
												border: "1px solid #0ea5e9",
												padding: "4px 8px",
												borderRadius: "4px",
												cursor: "pointer",
												fontSize: "10px",
											}}
										>
											📋 Copy JSON
										</button>
									</div>
									<pre
										style={{
											background: "#09090B",
											padding: "16px",
											borderRadius: "8px",
											border: "1px solid #27272A",
											maxHeight: "300px",
											overflow: "auto",
											margin: 0,
											color: selectedQuery.error ? "#f87171" : "#4ade80",
											fontSize: "12px",
										}}
									>
										{JSON.stringify(
											selectedQuery.data ??
												selectedQuery.error ??
												"No Data / Error",
											null,
											2,
										)}
									</pre>
								</div>
							</div>
						) : null}
					</div>
				</div>
			)}
		</div>
	);
}
