import { useState, useEffect, useMemo } from "react";
import { useQueryClient, Query, Mutation } from "@tanstack/react-query";

export function TauriQueryInspector() {
	const queryClient = useQueryClient();
	const [isOpen, setIsOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<"queries" | "mutations">(
		"queries",
	);

	// Search & Cache State
	const [search, setSearch] = useState("");
	const [queries, setQueries] = useState<any[]>([]);
	const [mutations, setMutations] = useState<any[]>([]);

	// Selection & Modal States
	const [selectedKey, setSelectedKey] = useState<string | null>(null);
	const [selectedMutationId, setSelectedMutationId] = useState<number | null>(
		null,
	);
	const [mockInput, setMockInput] = useState("");
	const [showMockEditor, setShowMockEditor] = useState(false);
	const [isOffline, setIsOffline] = useState(false);

	// 1. Live Query Cache Listener
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
						options: q.options,
					};
				}),
			);
		};

		updateQueries();
		return cache.subscribe(updateQueries);
	}, [queryClient]);

	// 2. Live Mutation Cache Listener
	useEffect(() => {
		const mutationCache = queryClient.getMutationCache();
		const updateMutations = () => {
			setMutations(
				mutationCache.getAll().map((m: Mutation<any, any, any>) => ({
					mutationId: m.mutationId,
					status: m.state.status,
					isPaused: m.state.isPaused,
					submittedAt: m.state.submittedAt
						? new Date(m.state.submittedAt).toLocaleTimeString()
						: "N/A",
					variables: m.state.variables,
					data: m.state.data,
					error: m.state.error,
				})),
			);
		};

		updateMutations();
		return mutationCache.subscribe(updateMutations);
	}, [queryClient]);

	// Key search filtering
	const filteredQueries = useMemo(() => {
		if (!search) return queries;
		return queries.filter((q) =>
			q.keyStr.toLowerCase().includes(search.toLowerCase()),
		);
	}, [queries, search]);

	const selectedQuery =
		queries.find((q) => q.keyStr === selectedKey) || filteredQueries[0];
	const selectedMutation =
		mutations.find((m) => m.mutationId === selectedMutationId) ||
		mutations[mutations.length - 1];

	// Feature: Inject custom JSON directly into Query Cache
	const handleInjectMockData = () => {
		if (!selectedQuery) return;
		try {
			const parsed = JSON.parse(mockInput);
			queryClient.setQueryData(selectedQuery.keyArray, parsed);
			setShowMockEditor(false);
			setMockInput("");
		} catch (err) {
			alert("Invalid JSON syntax!");
		}
	};

	// Feature: Export entire cache snapshot to clipboard
	const exportCacheSnapshot = () => {
		const cacheData = queryClient
			.getQueryCache()
			.getAll()
			.reduce(
				(acc, q) => {
					acc[q.queryHash] = q.state.data;
					return acc;
				},
				{} as Record<string, any>,
			);

		navigator.clipboard
			.writeText(JSON.stringify(cacheData, null, 2))
			.then(() => alert("Full cache snapshot copied to clipboard!"));
	};

	// Feature: Import cache snapshot from JSON
	const importCacheSnapshot = () => {
		const input = prompt("Paste cache JSON snapshot here:");
		if (!input) return;
		try {
			const parsed = JSON.parse(input);
			Object.entries(parsed).forEach(([queryHash, data]) => {
				const query = queryClient
					.getQueryCache()
					.getAll()
					.find((q) => q.queryHash === queryHash);
				if (query) {
					queryClient.setQueryData(query.queryKey, data);
				}
			});
			alert("Cache state hydrated!");
		} catch (e) {
			alert("Invalid JSON snapshot!");
		}
	};

	// Feature: Toggle global offline simulation mode
	const toggleOfflineMode = () => {
		const nextState = !isOffline;
		setIsOffline(nextState);
		queryClient.getOnlineManager().setOnline(!nextState);
	};

	// Copy helper
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
			{/* Floating Toggle Trigger */}
			<button
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
				}}
			>
				{isOpen
					? "✕ Close Inspector"
					: `🛸 God-Mode Inspector (${queries.length}Q | ${mutations.length}M)`}
			</button>

			{/* Main Inspector Window */}
			{isOpen && (
				<div
					style={{
						position: "fixed",
						bottom: 60,
						left: 12,
						width: "95vw",
						maxWidth: "1050px",
						height: "620px",
						background: "#0c0c0c",
						color: "#E5E7EB",
						border: "1px solid #27272A",
						borderRadius: "12px",
						display: "flex",
						flexDirection: "column",
						boxShadow: "0 16px 40px rgba(0,0,0,0.85)",
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
						{/* Tabs */}
						<div style={{ display: "flex", gap: "8px" }}>
							<button
								onClick={() => setActiveTab("queries")}
								style={{
									background: activeTab === "queries" ? "#0ea5e9" : "#27272A",
									color: "#fff",
									border: "none",
									padding: "6px 12px",
									borderRadius: "4px",
									cursor: "pointer",
									fontWeight: "bold",
								}}
							>
								Queries ({queries.length})
							</button>
							<button
								onClick={() => setActiveTab("mutations")}
								style={{
									background: activeTab === "mutations" ? "#d946ef" : "#27272A",
									color: "#fff",
									border: "none",
									padding: "6px 12px",
									borderRadius: "4px",
									cursor: "pointer",
									fontWeight: "bold",
								}}
							>
								Mutations ({mutations.length})
							</button>
						</div>

						{/* Filter */}
						{activeTab === "queries" && (
							<input
								type="text"
								placeholder="🔍 Search query keys..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								style={{
									background: "#09090B",
									border: "1px solid #3F3F46",
									color: "#fff",
									padding: "6px 12px",
									borderRadius: "6px",
									width: "200px",
									fontFamily: "monospace",
								}}
							/>
						)}

						{/* Controls */}
						<div style={{ display: "flex", gap: "6px" }}>
							<button
								onClick={toggleOfflineMode}
								style={{
									background: isOffline ? "#dc2626" : "#27272A",
									color: "#fff",
									border: "1px solid #3F3F46",
									padding: "6px 10px",
									borderRadius: "4px",
									cursor: "pointer",
									fontWeight: "bold",
									fontSize: "11px",
								}}
							>
								{isOffline ? "📡 Mode: OFFLINE" : "🌐 Mode: ONLINE"}
							</button>
							<button
								onClick={exportCacheSnapshot}
								style={{
									background: "#0284c7",
									color: "#fff",
									border: "none",
									padding: "6px 10px",
									borderRadius: "4px",
									cursor: "pointer",
									fontSize: "11px",
								}}
							>
								💾 Export
							</button>
							<button
								onClick={importCacheSnapshot}
								style={{
									background: "#7c3aed",
									color: "#fff",
									border: "none",
									padding: "6px 10px",
									borderRadius: "4px",
									cursor: "pointer",
									fontSize: "11px",
								}}
							>
								📥 Import
							</button>
							<button
								onClick={() => {
									queryClient.clear();
									queryClient.getMutationCache().clear();
								}}
								style={{
									background: "#7f1d1d",
									color: "#fff",
									border: "none",
									padding: "6px 10px",
									borderRadius: "4px",
									cursor: "pointer",
									fontSize: "11px",
								}}
							>
								☢️ Nuke Cache
							</button>
						</div>
					</div>

					{/* Main Layout Workspace */}
					<div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
						{/* Left Sidebar List */}
						<div
							style={{
								width: "350px",
								borderRight: "1px solid #27272A",
								overflowY: "auto",
								background: "#09090B",
							}}
						>
							{activeTab === "queries"
								? filteredQueries.map((q) => (
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
												background:
													selectedQuery?.keyStr === q.keyStr
														? "#27272A"
														: "transparent",
												borderLeft: `4px solid ${q.stateColor}`,
											}}
										>
											<div
												style={{
													fontSize: "12px",
													fontWeight: "bold",
													color: "#fff",
													wordBreak: "break-all",
													marginBottom: "6px",
												}}
											>
												{q.keyStr}
											</div>
											<div
												style={{
													display: "flex",
													gap: "8px",
													fontSize: "10px",
												}}
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
											</div>
										</div>
									))
								: mutations.map((m) => (
										<div
											key={m.mutationId}
											onClick={() => setSelectedMutationId(m.mutationId)}
											style={{
												padding: "12px",
												borderBottom: "1px solid #18181B",
												cursor: "pointer",
												background:
													selectedMutation?.mutationId === m.mutationId
														? "#27272A"
														: "transparent",
												borderLeft: `4px solid ${m.status === "success" ? "#10B981" : m.status === "error" ? "#EF4444" : "#3B82F6"}`,
											}}
										>
											<div
												style={{
													fontSize: "12px",
													fontWeight: "bold",
													color: "#d946ef",
													marginBottom: "6px",
												}}
											>
												Mutation #{m.mutationId}
											</div>
											<div style={{ fontSize: "10px", color: "#a1a1aa" }}>
												Status: {m.status} | {m.submittedAt}
											</div>
										</div>
									))}
						</div>

						{/* Right Details Workspace */}
						<div
							style={{
								flex: 1,
								padding: "20px",
								overflowY: "auto",
								background: "#121212",
							}}
						>
							{activeTab === "queries" && selectedQuery ? (
								<>
									{/* Action Toolbar */}
									<div
										style={{
											display: "flex",
											gap: "8px",
											flexWrap: "wrap",
											marginBottom: "16px",
											background: "#18181B",
											padding: "12px",
											borderRadius: "8px",
											border: "1px solid #27272A",
										}}
									>
										<button
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
											⚠️ Invalidate
										</button>
										<button
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

									{/* Inject Editor */}
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
													height: "140px",
													background: "#020617",
													color: "#a5f3fc",
													border: "1px solid #334155",
													padding: "12px",
													borderRadius: "6px",
													fontFamily: "monospace",
												}}
											/>
											<button
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

									{/* Configuration Grid */}
									<div
										style={{
											display: "grid",
											gridTemplateColumns: "repeat(3, 1fr)",
											gap: "10px",
											fontSize: "11px",
											marginBottom: "16px",
										}}
									>
										<div
											style={{
												background: "#18181B",
												padding: "10px",
												borderRadius: "6px",
												border: "1px solid #27272A",
											}}
										>
											<div style={{ color: "#71717A", marginBottom: "2px" }}>
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
												padding: "10px",
												borderRadius: "6px",
												border: "1px solid #27272A",
											}}
										>
											<div style={{ color: "#71717A", marginBottom: "2px" }}>
												gcTime
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
												padding: "10px",
												borderRadius: "6px",
												border: "1px solid #27272A",
											}}
										>
											<div style={{ color: "#71717A", marginBottom: "2px" }}>
												Updated
											</div>
											<div style={{ color: "#fff" }}>
												{selectedQuery.dataUpdatedAt}
											</div>
										</div>
									</div>

									{/* Cached Data Explorer */}
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
												Cached Payload
											</div>
											<button
												onClick={() =>
													copyToClipboard(
														selectedQuery.data || selectedQuery.error,
													)
												}
												style={{
													background: "transparent",
													color: "#0ea5e9",
													border: "1px solid #0ea5e9",
													padding: "3px 8px",
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
												padding: "14px",
												borderRadius: "8px",
												border: "1px solid #27272A",
												maxHeight: "260px",
												overflow: "auto",
												margin: 0,
												color: selectedQuery.error ? "#f87171" : "#4ade80",
												fontSize: "12px",
											}}
										>
											{JSON.stringify(
												selectedQuery.data ?? selectedQuery.error ?? "No Data",
												null,
												2,
											)}
										</pre>
									</div>
								</>
							) : activeTab === "mutations" && selectedMutation ? (
								<>
									<div
										style={{
											fontSize: "15px",
											fontWeight: "bold",
											color: "#d946ef",
											marginBottom: "16px",
										}}
									>
										Mutation #{selectedMutation.mutationId} Payload
									</div>

									<div
										style={{
											fontWeight: "bold",
											color: "#a1a1aa",
											marginBottom: "6px",
										}}
									>
										Variables Sent to IPC/Backend
									</div>
									<pre
										style={{
											background: "#09090B",
											padding: "14px",
											borderRadius: "8px",
											border: "1px solid #27272A",
											color: "#fcd34d",
											fontSize: "12px",
											marginBottom: "16px",
										}}
									>
										{JSON.stringify(
											selectedMutation.variables ?? "No Variables",
											null,
											2,
										)}
									</pre>

									<div
										style={{
											fontWeight: "bold",
											color: "#a1a1aa",
											marginBottom: "6px",
										}}
									>
										Mutation Response / Error
									</div>
									<pre
										style={{
											background: "#09090B",
											padding: "14px",
											borderRadius: "8px",
											border: "1px solid #27272A",
											color: selectedMutation.error ? "#f87171" : "#4ade80",
											fontSize: "12px",
										}}
									>
										{JSON.stringify(
											selectedMutation.data ??
												selectedMutation.error ??
												"Pending or Empty Response",
											null,
											2,
										)}
									</pre>
								</>
							) : (
								<div style={{ color: "#71717a" }}>
									Select an entry on the left to inspect.
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
