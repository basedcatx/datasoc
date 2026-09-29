import type { R } from "#/lib/libs";

export const mockRecords: R[] = [
	{
		id: 1,
		name: "Centrifugal pump vibration analysis",
		content: `Baseline vibration on the P-204 centrifugal pump sits at 4.2 mm/s RMS at the driver end. Anything above 7.1 mm/s means stop and inspect.

Common causes in order of likelihood:
1. Impeller rub against the casing wear ring - shows up as a 1x running speed peak on the spectrum
2. Bearing degradation - broadband energy rising above 2 kHz
3. Soft foot on the motor mount - tighten in a star pattern, never sequentially
4. Coupling misalignment - angular shows 2x running speed, parallel shows 1x

The wear ring is a 6 mm clearance part. We replaced it at 9 mm and the 1x peak disappeared entirely. Re-check alignment after any impeller change because pulling the pump apart always disturbs it.

Next service due at 4000 hours. Log the reading every month so you can see the trend rather than guessing from a single number.`,
		content_html: `
<h1>Centrifugal Pump Vibration Analysis</h1>

<h2>1. Baseline Readings</h2>
<p>
  Baseline vibration on the P-204 centrifugal pump sits at <strong>4.2 mm/s RMS</strong> at the driver end. Anything above <strong>7.1 mm/s</strong> means stop and inspect.
</p>

<img
  src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=80"
  alt="Industrial centrifugal pump and motor assembly on a skid"
  style="width: 100%; height: 250px; object-fit: cover; display: block; border-radius: 8px; margin: 24px 0;"
/>

<h2>2. Common Causes, in Order of Likelihood</h2>
<ol>
  <li>
    <p><strong>Impeller rub against the casing wear ring</strong> - shows up as a 1x running speed peak on the spectrum.</p>
  </li>
  <li>
    <p><strong>Bearing degradation</strong> - broadband energy rising above 2 kHz.</p>
  </li>
  <li>
    <p><strong>Soft foot on the motor mount</strong> - tighten in a star pattern, never sequentially.</p>
  </li>
  <li>
    <p><strong>Coupling misalignment</strong> - angular shows 2x running speed, parallel shows 1x.</p>
  </li>
</ol>

<h2>3. Findings and Correction</h2>
<p>
  The wear ring is a 6 mm clearance part. We replaced it at 9 mm and the 1x peak disappeared entirely. Re-check alignment after any impeller change because pulling the pump apart always disturbs it.
</p>
<p>
  Post-replacement vibration dropped to <strong>3.1 mm/s RMS</strong>, which is below the original baseline.
</p>

<h2>4. Service Interval</h2>
<p>
  Next service due at <strong>4000 hours</strong>. Log the reading every month so you can see the trend rather than guessing from a single number.
</p>
`,
		tags: ["pump", "vibration", "maintenance", "predictive"],
		meta: { asset: "P-204", location: "Pump room B", priority: "high" },
		flags: 6,
		created_at: "2026-07-04T08:15:00Z",
		updated_at: "2026-09-18T14:20:00Z",
	},
	{
		id: 2,
		name: "Hydraulic oil sampling procedure",
		content: `Sample hydraulic oil from the live machine, never from a drained tank. Running oil carries the wear particles you actually care about.

Procedure:
1. Machine at operating temperature, 1800 rpm minimum
2. Sample from the return line upstream of the filter
3. Use a clean bottle every time - a reused bottle contaminates the sample and you will chase a phantom
4. Let it sit 30 minutes before testing so air and water separate out
5. Send for particle count and viscosity

Target is ISO 18/16/13 or better. The third number is the coarse particle count and it is the one that tells you about pump and filter wear. When 18/16/13 degrades to 18/16/16 something in the system is shedding metal.

Sample every 500 hours or monthly, whichever comes first.`,
		content_html: `
<h1>Hydraulic Oil Sampling Procedure</h1>

<h2>1. Principle</h2>
<p>
  Sample hydraulic oil from the <strong>live machine</strong>, never from a drained tank. Running oil carries the wear particles you actually care about.
</p>

<h2>2. Procedure</h2>
<ol>
  <li>
    <p>Machine at operating temperature, <strong>1800 rpm minimum</strong>.</p>
  </li>
  <li>
    <p>Sample from the return line <strong>upstream of the filter</strong>.</p>
  </li>
  <li>
    <p>Use a clean bottle every time - a reused bottle contaminates the sample and you will chase a phantom.</p>
  </li>
  <li>
    <p>Let it sit 30 minutes before testing so air and water separate out.</p>
  </li>
  <li>
    <p>Send for particle count and viscosity.</p>
  </li>
</ol>

<h2>3. Target Values</h2>
<p>
  Target is <strong>ISO 18/16/13</strong> or better. The third number is the coarse particle count and it is the one that tells you about pump and filter wear.
</p>
<p>
  When 18/16/13 degrades to <strong>18/16/16</strong> something in the system is shedding metal.
</p>

<h2>4. Interval</h2>
<p>
  Sample every <strong>500 hours</strong> or monthly, whichever comes first.
</p>
`,
		tags: ["hydraulics", "oil", "sampling", "condition-monitoring"],
		meta: { location: "Pump room B", interval: "500h" },
		flags: 2,
		created_at: "2026-06-21T10:00:00Z",
		updated_at: "2026-08-30T09:40:00Z",
	},
	{
		id: 3,
		name: "Transmission leak inspection walkthrough",
		content: `The 6-speed transmission has a slow seep at the bellhousing-to-case joint that we keep mistaking for a failing rear seal. It is not.

Diagnostic order:
1. Clean the joint completely, then run for 20 minutes at operating temp
2. Re-inspect with a paper towel. A genuine seal weep leaves a defined line; a case joint seep leaves a wide film
3. If the film is wide and the paper towel stays dry, it is the joint

Torque sequence matters. Work outside-in, 30% then 60% then 100%, cross-pattern. Seating it once at full torque gives you a leak that returns after 200 hours and you end up blaming the gasket.

Replace the gasket with a new one every time you open it. Reusing an old gasket is the reason the "same" leak comes back.`,
		content_html: `
<h1>Transmission Leak Inspection Walkthrough</h1>

<h2>1. Known Misdiagnosis</h2>
<p>
  The 6-speed transmission has a slow seep at the <strong>bellhousing-to-case joint</strong> that we keep mistaking for a failing rear seal. It is not.
</p>

<h2>2. Diagnostic Order</h2>
<ol>
  <li>
    <p>Clean the joint completely, then run for 20 minutes at operating temp.</p>
  </li>
  <li>
    <p>Re-inspect with a paper towel. A genuine seal weep leaves a <strong>defined line</strong>; a case joint seep leaves a <strong>wide film</strong>.</p>
  </li>
  <li>
    <p>If the film is wide and the paper towel stays dry, it is the joint.</p>
  </li>
</ol>

<h2>3. Torque Sequence</h2>
<p>
  Torque sequence matters. Work <strong>outside-in, 30% then 60% then 100%</strong>, cross-pattern. Seating it once at full torque gives you a leak that returns after 200 hours and you end up blaming the gasket.
</p>

<h2>4. Gasket Practice</h2>
<p>
  Replace the gasket with a new one every time you open it. Reusing an old gasket is the reason the "same" leak comes back.
</p>
`,
		tags: ["transmission", "leak", "inspection", "torque"],
		meta: { asset: "T-12", priority: "medium" },
		flags: 0,
		created_at: "2026-08-02T13:25:00Z",
		updated_at: "2026-09-01T11:10:00Z",
	},
	{
		id: 4,
		name: "Coolant system pressure test",
		content: `Radiator cap rating is 1.1 bar. Test at the filler neck cold, engine off.

If the gauge holds above 1.1 bar the cap is holding. If it drops to zero within 30 seconds you have either a failed cap or a leak somewhere in the loop.

A cold pressure test only finds the easy leaks. A hot test is what finds the cracked cylinder head or the gasket that blows only once things reach temperature. Do both, hot second.

Never open a hot system. Pressurised coolant at 95 degrees is scalding and it will find the gap in your glove. Let it cool for at least an hour and crack the cap slowly with a rag over the fitting.`,
		content_html: `
<h1>Coolant System Pressure Test</h1>

<h2>1. Test Conditions</h2>
<p>
  Radiator cap rating is <strong>1.1 bar</strong>. Test at the filler neck cold, engine off.
</p>

<h2>2. Interpreting Readings</h2>
<ul>
  <li>
    <p>Gauge holds above 1.1 bar - the cap is holding.</p>
  </li>
  <li>
    <p>Drops to zero within 30 seconds - either a failed cap or a leak somewhere in the loop.</p>
  </li>
</ul>

<h2>3. Cold First, Hot Second</h2>
<p>
  A cold pressure test only finds the easy leaks. A <strong>hot test</strong> is what finds the cracked cylinder head or the gasket that blows only once things reach temperature. Do both, hot second.
</p>

<blockquote>
  <p><strong>Safety:</strong> Never open a hot system. Pressurised coolant at 95 degrees is scalding and it will find the gap in your glove. Let it cool for at least an hour and crack the cap slowly with a rag over the fitting.</p>
</blockquote>
`,
		tags: ["cooling", "cooling-system", "pressure", "safety"],
		meta: { asset: "E-07", priority: "high" },
		flags: 0,
		created_at: "2026-08-11T07:50:00Z",
		updated_at: "2026-08-11T07:50:00Z",
	},
	{
		id: 5,
		name: "Brake caliper piston overhaul notes",
		content: `Front-left caliper sticking after a cold start. Piston boots were perished and the piston had light surface corrosion.

Overhaul:
1. Siphon the reservoir, do not let air into the line
2. Remove the caliper, hang it so the pistons do not drop out
3. Pump the pistons out by hand, never with compressed air - compressed air drives rust further into the bore
4. Inspect the bore for scoring. A scored bore needs a new caliper, not a clean and reassemble
5. New dust boots and new seals. Always. The seals are what keep fluid out of the bore
6. Bleed in this order - furthest from the master cylinder first

Torque the guide pin bolts with a smear of copper grease. Dry they seize within a year and the sticking comes back, and next time it is the guide pins, not the pistons.`,
		content_html: `
<h1>Brake Caliper Piston Overhaul Notes</h1>

<h2>1. Fault Found</h2>
<p>
  Front-left caliper sticking after a cold start. Piston boots were perished and the piston had light surface corrosion.
</p>

<img
  src="https://images.unsplash.com/photo-1613214149920-f8b4b4d1f0e1?auto=format&fit=crop&w=1200&q=80"
  alt="Disc brake caliper assembly with exposed piston bore"
  style="width: 100%; height: 250px; object-fit: cover; display: block; border-radius: 8px; margin: 24px 0;"
/>

<h2>2. Overhaul Procedure</h2>
<ol>
  <li>
    <p>Siphon the reservoir, do not let air into the line.</p>
  </li>
  <li>
    <p>Remove the caliper, hang it so the pistons do not drop out.</p>
  </li>
  <li>
    <p>Pump the pistons out <strong>by hand</strong>, never with compressed air - compressed air drives rust further into the bore.</p>
  </li>
  <li>
    <p>Inspect the bore for scoring. A scored bore needs a <strong>new caliper</strong>, not a clean and reassemble.</p>
  </li>
  <li>
    <p>New dust boots and new seals. Always. The seals are what keep fluid out of the bore.</p>
  </li>
  <li>
    <p>Bleed in this order - furthest from the master cylinder first.</p>
  </li>
</ol>

<h2>3. Reassembly</h2>
<p>
  Torque the guide pin bolts with a smear of <strong>copper grease</strong>. Dry they seize within a year and the sticking comes back, and next time it is the guide pins, not the pistons.
</p>
`,
		tags: ["brakes", "caliper", "overhaul", "hydraulics"],
		meta: { asset: "V-03", location: "Bay 1" },
		flags: 4,
		created_at: "2026-05-30T15:45:00Z",
		updated_at: "2026-07-19T08:05:00Z",
	},
	{
		id: 6,
		name: "Bearing replacement guide",
		content: `Replacing a bearing is 20 minutes of work and 3 hours of waiting. Get the bearing before you start, not after.

The trap is damaging the new bearing during installation. Never drive the outer race with the inner race still on. Press the race that carries the load.

Induction heater is the correct tool for a bearing with a tight fit. If you do not have one, a dry socket and a hammer works, but go slowly and hit the outer race only.

Check the shaft and housing bore for wear while it is apart. A new bearing in a worn bore has maybe 200 hours of life and then you are doing this job again for nothing. Measure before you commit.`,
		content_html: `
<h1>Bearing Replacement Guide</h1>

<h2>1. Lead Time</h2>
<p>
  Replacing a bearing is <strong>20 minutes of work and 3 hours of waiting</strong>. Get the bearing before you start, not after.
</p>

<h2>2. Installation</h2>
<p>
  The trap is damaging the new bearing during installation. <strong>Never drive the outer race with the inner race still on.</strong> Press the race that carries the load.
</p>
<p>
  An induction heater is the correct tool for a bearing with a tight fit. If you do not have one, a dry socket and a hammer works, but go slowly and hit the outer race only.
</p>

<h2>3. Inspection Before Committing</h2>
<p>
  Check the shaft and housing bore for wear while it is apart. A new bearing in a worn bore has maybe <strong>200 hours</strong> of life and then you are doing this job again for nothing. Measure before you commit.
</p>
`,
		tags: ["bearing", "maintenance", "installation"],
		meta: { priority: "low" },
		flags: 1,
		created_at: "2026-04-14T12:00:00Z",
		updated_at: "2026-06-02T16:30:00Z",
	},
	{
		id: 7,
		name: "Weekly log - week 38",
		content: `Monday: inspected the chiller condenser, fins fouled with debris from the roof work. Cleaned, no refrigerant loss.

Tuesday: P-204 vibration reading 4.4 mm/s, up 0.2 from last week. Not alarming yet but it is trending up. Keep watching.

Wednesday: ordered a replacement wear ring for P-204, ETA Thursday. Lead time has been four days this month.

Thursday: fitted the wear ring. Re-checked alignment, was off by 0.4 degrees. Corrected it and the vibration dropped to 3.1 mm/s. Lower than the original baseline.

Friday: two hours on the editor, tagging and search filtering. The filter input re-renders the whole list on every keystroke and it is noticeable with more than 50 records.

Weekend: no site work.`,
		content_html: `
<h1>Weekly Log - Week 38</h1>

<h2>Monday</h2>
<p>
  Inspected the chiller condenser, fins fouled with debris from the roof work. Cleaned, no refrigerant loss.
</p>

<h2>Tuesday</h2>
<p>
  P-204 vibration reading <strong>4.4 mm/s</strong>, up 0.2 from last week. Not alarming yet but it is trending up. Keep watching.
</p>

<h2>Wednesday</h2>
<p>
  Ordered a replacement wear ring for P-204, ETA Thursday. Lead time has been four days this month.
</p>

<h2>Thursday</h2>
<p>
  Fitted the wear ring. Re-checked alignment, was off by 0.4 degrees. Corrected it and the vibration dropped to <strong>3.1 mm/s</strong>. Lower than the original baseline.
</p>

<h2>Friday</h2>
<p>
  Two hours on the editor, tagging and search filtering. The filter input re-renders the whole list on every keystroke and it is noticeable with more than 50 records.
</p>

<h2>Weekend</h2>
<p>
  No site work.
</p>
`,
		tags: ["log", "weekly", "chiller", "pump"],
		meta: { week: "38", author: "me" },
		flags: 2,
		created_at: "2026-09-14T06:00:00Z",
		updated_at: "2026-09-20T17:15:00Z",
	},
	{
		id: 8,
		name: "Torque wrench calibration intervals",
		content: `Six month calibration for the main wrenches, twelve for the small click types. The calibration sticker on the handle is the authority, not your memory.

Always pull to zero before setting. A wrench left at 40 Nm and then set to 80 Nm measures the delta, not the true value, and the error compounds with every setting change.

If a fastener will be undone more than three times, throw the wrench out and take a new one out. A wrench that drifts out of calibration is worse than no wrench because you trust it.

Log every calibration in the maintenance system with the serial number. When a fastener comes loose in the field, the last calibration date for that wrench is the first thing anyone will ask for.`,
		content_html: `
<h1>Torque Wrench Calibration Intervals</h1>

<h2>1. Intervals</h2>
<ul>
  <li>
    <p><strong>Six months</strong> for the main wrenches.</p>
  </li>
  <li>
    <p><strong>Twelve months</strong> for the small click types.</p>
  </li>
</ul>
<p>
  The calibration sticker on the handle is the authority, not your memory.
</p>

<h2>2. Zero Before Setting</h2>
<p>
  Always pull to zero before setting. A wrench left at 40 Nm and then set to 80 Nm measures the <strong>delta</strong>, not the true value, and the error compounds with every setting change.
</p>

<h2>3. Replacement Policy</h2>
<p>
  If a fastener will be undone more than three times, throw the wrench out and take a new one out. A wrench that drifts out of calibration is worse than no wrench because you trust it.
</p>

<h2>4. Record Keeping</h2>
<p>
  Log every calibration in the maintenance system with the serial number. When a fastener comes loose in the field, the last calibration date for that wrench is the first thing anyone will ask for.
</p>
`,
		tags: ["tools", "calibration", "torque", "maintenance"],
		meta: { interval: "6mo", priority: "medium" },
		flags: 0,
		created_at: "2026-03-22T09:30:00Z",
		updated_at: "2026-03-22T09:30:00Z",
	},
	{
		id: 9,
		name: "Coolant flush and refill procedure",
		content: `Full flush, 2:1 coolant to distilled water. Never tap water, the mineral content precipitates into the heater core and you will be replacing the core instead.

Steps:
1. Drain from the radiator petcock into a pan, it is 4 litres
2. Run the heater on full to pull what is sitting in the heater core, that is where corrosion hides
3. Refill, bleed the system properly, run the engine with the cap off until the thermostat opens and you see steady flow at the radiator neck
4. Check level again after ten minutes of running. It drops as the cold volume is displaced
5. Top up and cap

A 15 psi cap is the standard here, not the 1.1 bar rated cap. Confusing the two causes either slow overheating or an airlock.`,
		content_html: `
<h1>Coolant Flush and Refill Procedure</h1>

<h2>1. Mix Ratio</h2>
<p>
  Full flush, <strong>2:1 coolant to distilled water</strong>. Never tap water - the mineral content precipitates into the heater core and you will be replacing the core instead.
</p>

<h2>2. Steps</h2>
<ol>
  <li>
    <p>Drain from the radiator petcock into a pan, it is 4 litres.</p>
  </li>
  <li>
    <p>Run the heater on full to pull what is sitting in the heater core, that is where corrosion hides.</p>
  </li>
  <li>
    <p>Refill, bleed the system properly, run the engine with the cap off until the thermostat opens and you see steady flow at the radiator neck.</p>
  </li>
  <li>
    <p>Check level again after ten minutes of running. It drops as the cold volume is displaced.</p>
  </li>
  <li>
    <p>Top up and cap.</p>
  </li>
</ol>

<h2>3. Cap Specification</h2>
<p>
  A <strong>15 psi cap</strong> is the standard here, not the 1.1 bar rated cap. Confusing the two causes either slow overheating or an airlock.
</p>
`,
		tags: ["cooling", "flush", "coolant", "procedure"],
		meta: { asset: "E-07" },
		flags: 0,
		created_at: "2026-08-25T11:20:00Z",
		updated_at: "2026-09-05T10:00:00Z",
	},
	{
		id: 10,
		name: "Old alignment rig notes",
		content: `Archived. The laser rig from the old bay is decommissioned and the replacement shim set went with it.

Keeping this only because the tolerance tables are still useful as a reference for what counts as in spec.

Nothing here applies to the current setup.`,
		content_html: `
<h1>Old Alignment Rig Notes</h1>

<p>
  Archived. The laser rig from the old bay is decommissioned and the replacement shim set went with it.
</p>
<p>
  Keeping this only because the tolerance tables are still useful as a reference for what counts as in spec.
</p>
<blockquote>
  <p>Nothing here applies to the current setup.</p>
</blockquote>
`,
		tags: ["alignment", "archive", "reference"],
		meta: { status: "archived" },
		flags: 1,
		created_at: "2026-02-08T14:00:00Z",
		updated_at: "2026-02-08T14:00:00Z",
	},
	{
		id: 11,
		name: "Compressed air safety audit",
		content: `Audited every compressed air use on site after the near miss in July.

Findings:
1. Two mechanics using an air gun to blow dust off their coveralls before leaving the workshop. This is the single most common way people get air embolism. Never, under any circumstances.
2. Air line had no filter regulator on one bench, so it was blowing moisture straight onto a job. Added a unit.
3. A 15 metre hose was run across the walkway and was the reason someone tripped. Re-routed overhead.

Rule going forward: air guns are for cleaning parts, not for cleaning people. If you want dust off you, use a brush or compressed clothing. If it is genuinely baked-on grime, use a washing machine.

Keep air pressure under 90 psi at the point of use. Everything on this site is rated for 90.`,
		content_html: `
<h1>Compressed Air Safety Audit</h1>

<h2>1. Background</h2>
<p>
  Audited every compressed air use on site after the near miss in July.
</p>

<h2>2. Findings</h2>
<ol>
  <li>
    <p>Two mechanics using an air gun to blow dust off their coveralls before leaving the workshop. This is the single most common way people get <strong>air embolism</strong>. Never, under any circumstances.</p>
  </li>
  <li>
    <p>Air line had no filter regulator on one bench, so it was blowing moisture straight onto a job. Added a unit.</p>
  </li>
  <li>
    <p>A 15 metre hose was run across the walkway and was the reason someone tripped. Re-routed overhead.</p>
  </li>
</ol>

<blockquote>
  <p>Air guns are for cleaning <strong>parts</strong>, not for cleaning <strong>people</strong>. If you want dust off you, use a brush or compressed clothing. If it is genuinely baked-on grime, use a washing machine.</p>
</blockquote>

<h2>3. Pressure Limit</h2>
<p>
  Keep air pressure under <strong>90 psi</strong> at the point of use. Everything on this site is rated for 90.
</p>
`,
		tags: ["safety", "compressed-air", "audit", "ppe"],
		meta: { auditor: "me", status: "closed" },
		flags: 0,
		created_at: "2026-07-28T08:00:00Z",
		updated_at: "2026-08-14T16:45:00Z",
	},
	{
		id: 12,
		name: "Chiller condenser maintenance log",
		content: `Air-cooled chiller, model AX-40. Condenser fins foul fast because of the roof work directly above it.

Cleaning interval: monthly during construction season, quarterly otherwise. A set of fins clogged to 30% of open area drops capacity by roughly 10% and spikes head pressure enough to trip the high pressure alarm.

Cleaning method: compressed air from the inside out, working down the fin pack in the direction of airflow. Never clean from the outside in, you will pack debris deeper and make it worse. Vacuum the debris off the coil face as you go, do not just blow it to the next section.

Fin comb on any bent fins. Bent fins cut airflow and no amount of cleaning fixes the geometry.

Ambient sensor reading was drifting 2 degrees high which was making the control loop overshoot. Reseated the sensor and it now tracks the reference within 0.5 degrees.`,
		content_html: `
<h1>Chiller Condenser Maintenance Log</h1>

<h2>1. Equipment</h2>
<p>
  Air-cooled chiller, model <strong>AX-40</strong>. Condenser fins foul fast because of the roof work directly above it.
</p>

<h2>2. Cleaning Interval</h2>
<p>
  Monthly during construction season, quarterly otherwise. A set of fins clogged to 30% of open area drops capacity by roughly 10% and spikes head pressure enough to trip the high pressure alarm.
</p>

<h2>3. Cleaning Method</h2>
<p>
  Compressed air from the <strong>inside out</strong>, working down the fin pack in the direction of airflow. Never clean from the outside in, you will pack debris deeper and make it worse. Vacuum the debris off the coil face as you go, do not just blow it to the next section.
</p>
<p>
  Fin comb on any bent fins. Bent fins cut airflow and no amount of cleaning fixes the geometry.
</p>

<h2>4. Sensor Correction</h2>
<p>
  Ambient sensor reading was drifting 2 degrees high which was making the control loop overshoot. Reseated the sensor and it now tracks the reference within 0.5 degrees.
</p>
`,
		tags: ["chiller", "hvac", "cooling", "maintenance", "log"],
		meta: { asset: "CH-01", interval: "monthly" },
		flags: 4,
		created_at: "2026-05-12T11:00:00Z",
		updated_at: "2026-09-12T13:30:00Z",
	},
	{
		id: 13,
		name: "Gearbox oil analysis results - Q3",
		content: `Sent samples from all four gearboxes to the lab. Results below, along with my read of each.

GB-01 (primary conveyor): 18/16/12, iron 14 ppm. Healthy. No action.
GB-02 (secondary): 18/16/14, iron 31 ppm, copper 8 ppm. Iron is climbing and copper alongside it points at the gear mesh rather than bearing wear. Watch it, change oil at next window.
GB-03 (mill feed): 18/16/13, iron 22 ppm, plus 380 ppm aluminium. The aluminium is the interesting one. That is not normal for this gearbox and it suggests something upstream is shedding. Check the mill gearbox coupling alignment.
GB-04 (auxiliary): 18/16/11, iron 9 ppm. Cleanest on the list, lowest hours.

Overall the oil program is working. GB-03 is the one to act on.

Note for next quarter: sample from the same port each time. We have been inconsistent and it makes trending harder than it needs to be.`,
		content_html: `
<h1>Gearbox Oil Analysis Results - Q3</h1>

<h2>1. GB-01 - Primary Conveyor</h2>
<p>
  <strong>18/16/12, iron 14 ppm.</strong> Healthy. No action.
</p>

<h2>2. GB-02 - Secondary</h2>
<p>
  <strong>18/16/14, iron 31 ppm, copper 8 ppm.</strong> Iron is climbing and copper alongside it points at the gear mesh rather than bearing wear. Watch it, change oil at next window.
</p>

<h2>3. GB-03 - Mill Feed</h2>
<p>
  <strong>18/16/13, iron 22 ppm, plus 380 ppm aluminium.</strong> The aluminium is the interesting one. That is not normal for this gearbox and it suggests something upstream is shedding. Check the mill gearbox coupling alignment.
</p>

<h2>4. GB-04 - Auxiliary</h2>
<p>
  <strong>18/16/11, iron 9 ppm.</strong> Cleanest on the list, lowest hours.
</p>

<h2>5. Summary</h2>
<p>
  Overall the oil program is working. <strong>GB-03 is the one to act on.</strong>
</p>
<p>
  Note for next quarter: sample from the same port each time. We have been inconsistent and it makes trending harder than it needs to be.
</p>
`,
		tags: ["gearbox", "oil-analysis", "condition-monitoring", "report"],
		meta: { quarter: "Q3", status: "action-required" },
		flags: 6,
		created_at: "2026-09-08T09:15:00Z",
		updated_at: "2026-09-16T15:00:00Z",
	},
	{
		id: 14,
		name: "Reading a vibration spectrum",
		content: `A quick reference for interpreting the spectra that come out of the collector, written because I keep having to look the same things up.

1x running speed: unbalance or misalignment. The most common fault there is.
2x running speed: angular misalignment, or a bent shaft. If 2x is present with 1x, it is misalignment.
3x, 5x, 7x: harmonics of 1x. Growing 3x on a pump usually means cavitation or a soft foot.
Broadband, rising above 2 kHz: bearing degradation. Get the bearing out.
High frequency, stable amplitude with spikes: grease condition, or a problem the collector is aliasing.
Low frequency, 0.4 to 0.5x: subharmonic, usually a loose structure or a rubbing component.

The one thing that catches people: you cannot diagnose from a single reading. You diagnose from the change against last month. This is why logging the number matters more than knowing the limits.`,
		content_html: `
<h1>Reading a Vibration Spectrum</h1>

<p>
  A quick reference for interpreting the spectra that come out of the collector, written because I keep having to look the same things up.
</p>

<h2>1. Frequency Peaks</h2>
<ul>
  <li>
    <p><strong>1x running speed</strong> - unbalance or misalignment. The most common fault there is.</p>
  </li>
  <li>
    <p><strong>2x running speed</strong> - angular misalignment, or a bent shaft. If 2x is present with 1x, it is misalignment.</p>
  </li>
  <li>
    <p><strong>3x, 5x, 7x</strong> - harmonics of 1x. Growing 3x on a pump usually means cavitation or a soft foot.</p>
  </li>
  <li>
    <p><strong>Broadband, rising above 2 kHz</strong> - bearing degradation. Get the bearing out.</p>
  </li>
  <li>
    <p><strong>High frequency, stable amplitude with spikes</strong> - grease condition, or a problem the collector is aliasing.</p>
  </li>
  <li>
    <p><strong>Low frequency, 0.4 to 0.5x</strong> - subharmonic, usually a loose structure or a rubbing component.</p>
  </li>
</ul>

<blockquote>
  <p>You cannot diagnose from a single reading. You diagnose from the change against last month. This is why logging the number matters more than knowing the limits.</p>
</blockquote>
`,
		tags: ["vibration", "predictive", "reference", "analysis"],
		meta: { type: "reference" },
		flags: 0,
		created_at: "2026-06-05T14:20:00Z",
		updated_at: "2026-08-28T10:50:00Z",
	},
	{
		id: 15,
		name: "Steam trap inspection round",
		content: `Routine walk of all 14 steam traps, ultrasonic only, no disassembly.

Working well: T-01 through T-09. Ultrasonic readings consistent with last round.
Leaking: T-11. Clear continuous blow. This one is dumping live steam to condensate and it has been doing it for months.
Slow leaking: T-12, T-13. Ultrasonic shows a faint hiss rather than a steady tone. Both are failing their seat and will go from slow to full within a month.
Failed open: T-14. No reading at all and the discharge pipe is cold. The trap is passing everything through without condensing anything.

Replacement order: T-14 first because it is a live steam loss, then T-11, then T-12 and T-13 together.

T-10 and T-04 are in positions where the ultrasonic pickup is unreliable because of the pipe geometry. Next round I want to pull those two rather than keep guessing.`,
		content_html: `
<h1>Steam Trap Inspection Round</h1>

<p>
  Routine walk of all 14 steam traps, ultrasonic only, no disassembly.
</p>

<h2>2. Working Well</h2>
<p>
  T-01 through T-09. Ultrasonic readings consistent with last round.
</p>

<h2>3. Faults Found</h2>
<ul>
  <li>
    <p><strong>T-11 leaking</strong> - clear continuous blow. This one is dumping live steam to condensate and it has been doing it for months.</p>
  </li>
  <li>
    <p><strong>T-12, T-13 slow leaking</strong> - ultrasonic shows a faint hiss rather than a steady tone. Both are failing their seat and will go from slow to full within a month.</p>
  </li>
  <li>
    <p><strong>T-14 failed open</strong> - no reading at all and the discharge pipe is cold. The trap is passing everything through without condensing anything.</p>
  </li>
</ul>

<h2>4. Replacement Order</h2>
<p>
  T-14 first because it is a live steam loss, then T-11, then T-12 and T-13 together.
</p>

<h2>5. Unreliable Readings</h2>
<p>
  T-10 and T-04 are in positions where the ultrasonic pickup is unreliable because of the pipe geometry. Next round I want to pull those two rather than keep guessing.
</p>
`,
		tags: ["steam", "traps", "inspection", "utilities"],
		meta: { round: "2026-09", type: "ultrasonic" },
		flags: 0,
		created_at: "2026-09-15T05:30:00Z",
		updated_at: "2026-09-15T05:30:00Z",
	},
	{
		id: 16,
		name: "Weekly log - week 39",
		content: `Monday: started the gearbox oil analysis follow-up. GB-03 aluminium result is the one I need to chase down. Checked the mill coupling alignment, it was within 0.2 degrees so the aluminium is coming from somewhere else. Still looking.

Tuesday: steam trap round. Five faults out of fourteen which is a poor ratio. T-14 failed open and has been doing it for a while, that is a real money leak.

Wednesday: four hours on the app. Got hybrid search wired up properly and the results are noticeably better than the keyword-only version was. Ranked ordering now makes sense.

Thursday: cleaned the chiller fins again, construction debris from the roof is relentless. Considering a mesh guard over the coil to stop it at the source rather than cleaning monthly.

Friday: torque wrench calibration due for the three main wrenches. Booked for next Tuesday.

Weekend: no site work.`,
		content_html: `
<h1>Weekly Log - Week 39</h1>

<h2>Monday</h2>
<p>
  Started the gearbox oil analysis follow-up. GB-03 aluminium result is the one I need to chase down. Checked the mill coupling alignment, it was within 0.2 degrees so the aluminium is coming from somewhere else. Still looking.
</p>

<h2>Tuesday</h2>
<p>
  Steam trap round. <strong>Five faults out of fourteen</strong> which is a poor ratio. T-14 failed open and has been doing it for a while, that is a real money leak.
</p>

<h2>Wednesday</h2>
<p>
  Four hours on the app. Got hybrid search wired up properly and the results are noticeably better than the keyword-only version was. Ranked ordering now makes sense.
</p>

<h2>Thursday</h2>
<p>
  Cleaned the chiller fins again, construction debris from the roof is relentless. Considering a mesh guard over the coil to stop it at the source rather than cleaning monthly.
</p>

<h2>Friday</h2>
<p>
  Torque wrench calibration due for the three main wrenches. Booked for next Tuesday.
</p>

<h2>Weekend</h2>
<p>
  No site work.
</p>
`,
		tags: ["log", "weekly", "gearbox", "steam", "chiller"],
		meta: { week: "39", author: "me" },
		flags: 2,
		created_at: "2026-09-21T06:00:00Z",
		updated_at: "2026-09-27T18:00:00Z",
	},
	{
		id: 17,
		name: "Hydraulic hose inspection criteria",
		content: `Replacing a hose on a schedule is cheaper than replacing it on a failure. Here is what I actually look at.

Whip check: if the hose whips when the fluid moves, the routing is wrong regardless of how the cover looks. Re-route before you re-strap.
Cover condition: look at the braid. Any fraying, glossing or flat spots means replace. Do not wait for a bulge, by the time you see a bulge it is already failed.
Age: rubber ages from the day of manufacture, not the day of installation. Check the date code. Six years is the working limit on most CR and CMR hose.
Chafing: any point where the hose touches a sharp edge or another hose. Sleeve it or re-route.
Twist: if the hose is twisted in its fittings, it will fail early. The two ferrules should sit square and the hose should leave the fitting without a twist.

Do not use a crimped hose in a high-pressure application if a clamped fitting is available. The clamp gives you a visual leak indicator as the bolt loosens, which the crimp does not.`,
		content_html: `
<h1>Hydraulic Hose Inspection Criteria</h1>

<p>
  Replacing a hose on a schedule is cheaper than replacing it on a failure. Here is what I actually look at.
</p>

<h2>1. Inspection Points</h2>
<ul>
  <li>
    <p><strong>Whip check</strong> - if the hose whips when the fluid moves, the routing is wrong regardless of how the cover looks. Re-route before you re-strap.</p>
  </li>
  <li>
    <p><strong>Cover condition</strong> - look at the braid. Any fraying, glossing or flat spots means replace. Do not wait for a bulge, by the time you see a bulge it is already failed.</p>
  </li>
  <li>
    <p><strong>Age</strong> - rubber ages from the day of manufacture, not the day of installation. Check the date code. <strong>Six years</strong> is the working limit on most CR and CMR hose.</p>
  </li>
  <li>
    <p><strong>Chafing</strong> - any point where the hose touches a sharp edge or another hose. Sleeve it or re-route.</p>
  </li>
  <li>
    <p><strong>Twist</strong> - if the hose is twisted in its fittings, it will fail early. The two ferrules should sit square and the hose should leave the fitting without a twist.</p>
  </li>
</ul>

<blockquote>
  <p>Do not use a crimped hose in a high-pressure application if a clamped fitting is available. The clamp gives you a visual leak indicator as the bolt loosens, which the crimp does not.</p>
</blockquote>
`,
		tags: ["hydraulics", "hose", "inspection", "safety"],
		meta: { type: "reference", priority: "high" },
		flags: 0,
		created_at: "2026-07-03T10:30:00Z",
		updated_at: "2026-09-10T09:00:00Z",
	},
	{
		id: 18,
		name: "Motor rebalancing procedure",
		content: `Two motors needed dynamic balancing after impeller fouling deposits came off. Here is the order that worked.

Before touching anything, check runout at each end with a dial indicator. If runout is already out of spec, balancing is wasted effort because you will chase the runout as if it were imbalance.

Rotor preparation: strip the rotor completely, clean every channel, check for deposit build-up in the cooling passages. The deposits are almost always the root cause of why balance drifted in the first place, and if you leave them you will be back in a year.

Balance at the correct speed for the machine, not the motor's rated speed. A 1500 rpm motor on a 3000 rpm pump is a different balance problem entirely.

Corrective action is always half the unbalance. Full correction makes it worse because you are now introducing a counter-unbalance into a rotor that will run slightly differently once the impeller is refitted.

Record the final residual and the plane readings. If the residual is above about 3 gmm at the coupling end, the bearings are worn and no amount of balancing fixes that.`,
		content_html: `
<h1>Motor Rebalancing Procedure</h1>

<p>
  Two motors needed dynamic balancing after impeller fouling deposits came off. Here is the order that worked.
</p>

<h2>1. Before Touching Anything</h2>
<p>
  Check runout at each end with a dial indicator. If runout is already out of spec, balancing is wasted effort because you will chase the runout as if it were imbalance.
</p>

<h2>2. Rotor Preparation</h2>
<p>
  Strip the rotor completely, clean every channel, check for deposit build-up in the cooling passages. The deposits are almost always the <strong>root cause</strong> of why balance drifted in the first place, and if you leave them you will be back in a year.
</p>

<h2>3. Balance Speed</h2>
<p>
  Balance at the correct speed for the machine, not the motor's rated speed. A 1500 rpm motor on a 3000 rpm pump is a different balance problem entirely.
</p>

<h2>4. Corrective Weight</h2>
<p>
  Corrective action is always <strong>half</strong> the unbalance. Full correction makes it worse because you are now introducing a counter-unbalance into a rotor that will run slightly differently once the impeller is refitted.
</p>

<h2>5. Record Keeping</h2>
<p>
  Record the final residual and the plane readings. If the residual is above about <strong>3 gmm</strong> at the coupling end, the bearings are worn and no amount of balancing fixes that.
</p>
`,
		tags: ["motor", "balancing", "vibration", "rotor", "procedure"],
		meta: { topic: "rotor", priority: "medium" },
		flags: 0,
		created_at: "2026-08-18T13:40:00Z",
		updated_at: "2026-08-19T08:20:00Z",
	},
	{
		id: 19,
		name: "Lockout tagout procedure",
		content: `Full LOTO procedure, written after the review found two people had never been trained on it.

Sequence:
1. Notify everyone affected by the shutdown, by name, not by email
2. Shut down the equipment using the normal control means
3. Isolate all energy sources - electrical, pneumatic, hydraulic, gravity, thermal, and stored mechanical energy from a raised load
4. Dissipate stored energy. Bleed lines, block raised components, discharge capacitors
5. Apply your personal lock and tag. One person, one lock, one key
6. Release stored energy and try the start control to confirm the isolation actually holds
7. Only then begin work

Tag content: name, date, reason for the lock, and how to contact you. A tag with no contact number is a tag that will be cut off by someone who cannot reach you, and then your isolation is gone.

Group lock boxes: for work where more than one person is exposed, the box is the primary isolation and each person adds their own personal lock to it. Never accept a lock that does not have your lock on it.

Removing someone else's lock requires the shift supervisor and a documented attempt to contact them. No exceptions for convenience.`,
		content_html: `
<h1>Lockout Tagout Procedure</h1>

<p>
  Full LOTO procedure, written after the review found two people had never been trained on it.
</p>

<h2>1. Sequence</h2>
<ol>
  <li>
    <p>Notify everyone affected by the shutdown, by name, not by email.</p>
  </li>
  <li>
    <p>Shut down the equipment using the normal control means.</p>
  </li>
  <li>
    <p>Isolate all energy sources - electrical, pneumatic, hydraulic, gravity, thermal, and stored mechanical energy from a raised load.</p>
  </li>
  <li>
    <p>Dissipate stored energy. Bleed lines, block raised components, discharge capacitors.</p>
  </li>
  <li>
    <p>Apply your personal lock and tag. One person, one lock, one key.</p>
  </li>
  <li>
    <p>Release stored energy and try the start control to confirm the isolation actually holds.</p>
  </li>
  <li>
    <p>Only then begin work.</p>
  </li>
</ol>

<h2>2. Tag Content</h2>
<p>
  Name, date, reason for the lock, and how to contact you. A tag with no contact number is a tag that will be cut off by someone who cannot reach you, and then your isolation is gone.
</p>

<h2>3. Group Lock Boxes</h2>
<p>
  For work where more than one person is exposed, the box is the primary isolation and each person adds their own personal lock to it. Never accept a lock that does not have your lock on it.
</p>

<h2>4. Removing Another Lock</h2>
<p>
  Requires the shift supervisor and a documented attempt to contact them. <strong>No exceptions for convenience.</strong>
</p>
`,
		tags: ["safety", "loto", "lockout", "procedure", "compliance"],
		meta: { type: "procedure", priority: "critical" },
		flags: 4,
		created_at: "2026-06-30T09:00:00Z",
		updated_at: "2026-07-25T15:30:00Z",
	},
	{
		id: 20,
		name: "Root cause analysis - pump seal failure",
		content: `P-311 lost its mechanical seal after roughly 14 months. Did the full analysis rather than just replacing it, because the same thing happened on P-208 eight months ago and replacing seals on both is not a fix, it is a subscription.

What happened: seal ran dry for roughly 40 minutes after a trip on high discharge pressure. Dry running glazed the seal face within minutes. The seal was already destroyed before anyone noticed the flow change.

Contributing factors:
1. No seal flush on the outboard side. The flush line had been isolated during a previous job and never restored. This is the actual root cause.
2. A low-flow trip on the discharge that nobody reset. The pump sat idle with no flush and no seal protection.
3. The seal support plan was blank in the maintenance system, so there was nothing telling anyone the flush existed.

Actions taken: restored and labelled the flush line, added it to the isolation checklist, populated the seal support plan for all fourteen pumps, and added a seal-running-dry alarm on the outboard side for the critical machines.

Root cause statement: an undocumented isolation was not returned to service, and the absence of a seal support plan meant the dependency was invisible. The fix is documentation and interlocks, not a better seal.`,
		content_html: `
<h1>Root Cause Analysis - Pump Seal Failure</h1>

<h2>1. Incident</h2>
<p>
  P-311 lost its mechanical seal after roughly 14 months. Did the full analysis rather than just replacing it, because the same thing happened on P-208 eight months ago and replacing seals on both is not a fix, it is a subscription.
</p>

<h2>2. What Happened</h2>
<p>
  Seal ran dry for roughly 40 minutes after a trip on high discharge pressure. Dry running glazed the seal face within minutes. The seal was already destroyed before anyone noticed the flow change.
</p>

<h2>3. Contributing Factors</h2>
<ol>
  <li>
    <p>No seal flush on the outboard side. The flush line had been <strong>isolated during a previous job and never restored</strong>. This is the actual root cause.</p>
  </li>
  <li>
    <p>A low-flow trip on the discharge that nobody reset. The pump sat idle with no flush and no seal protection.</p>
  </li>
  <li>
    <p>The seal support plan was blank in the maintenance system, so there was nothing telling anyone the flush existed.</p>
  </li>
</ol>

<h2>4. Actions Taken</h2>
<ul>
  <li>
    <p>Restored and labelled the flush line, added it to the isolation checklist.</p>
  </li>
  <li>
    <p>Populated the seal support plan for all fourteen pumps.</p>
  </li>
  <li>
    <p>Added a seal-running-dry alarm on the outboard side for the critical machines.</p>
  </li>
</ul>

<blockquote>
  <p>Root cause statement: an undocumented isolation was not returned to service, and the absence of a seal support plan meant the dependency was invisible. <strong>The fix is documentation and interlocks, not a better seal.</strong></p>
</blockquote>
`,
		tags: ["pump", "seal", "root-cause", "rca", "failure", "report"],
		meta: { asset: "P-311", status: "closed", method: "5-why" },
		flags: 0,
		created_at: "2026-08-28T07:45:00Z",
		updated_at: "2026-09-22T14:20:00Z",
	},
];
