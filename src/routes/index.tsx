import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: HomePage,
	beforeLoad: () => {
		throw redirect({ to: "/home" });
	},
});

function HomePage() {
	return <div></div>;
}
