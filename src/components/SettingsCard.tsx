import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import {
	FieldLegend,
	FieldSet,
	FieldDescription,
	FieldGroup,
} from "./ui/field";
import { Switch } from "./ui/switch";

export default function SettingsCard({ Trigger }: { Trigger: ReactNode }) {
	return (
		<Dialog>
			<DialogTrigger asChild>{Trigger}</DialogTrigger>
			<DialogContent className="sm:max-w-sm w-xl rounded-2xl bg-background">
				<div>
					<FieldSet>
						<FieldLegend>General</FieldLegend>
						<FieldDescription>General app settings and feel</FieldDescription>
						<FieldGroup>
							<Switch />
						</FieldGroup>
					</FieldSet>

					<FieldSet>
						<FieldLegend>Profile</FieldLegend>
						<FieldDescription>
							Profile settings, used for cloud back up
						</FieldDescription>
					</FieldSet>
				</div>
			</DialogContent>
		</Dialog>
	);
}
