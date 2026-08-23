p = "app/admin/page.tsx"
s = open(p).read()

# 1) remove local AttemptsChart definition (moved to panels.tsx)
start = s.index("function AttemptsChart(")
end = s.index("function DashboardSection")
s = s[:start] + s[end:]

# 2) import panels
old_imp = 'import { Button, CountUp, Eyebrow, initials } from "@/components/ui";'
new_imp = old_imp + "\n" + 'import {\n\tAttemptsChart,\n\tCategoriesPanel,\n\tQuestionFormModal,\n\tSettingsPanel,\n\tUsersPanel as UsersPanelView,\n\tAnalyticsPanel as AnalyticsPanelView,\n} from "./panels";'
assert old_imp in s, "ui import anchor missing"
s = s.replace(old_imp, new_imp)

# 3) grouped nav replaces flat SECTIONS
start = s.index("const SECTIONS = [")
end = s.index('"review", label: "Review queue", icon: IconCheck },\n];')
end += len('"review", label: "Review queue", icon: IconCheck },\n];')

groups_code = '''interface SectionDef {
	id: SectionId;
	label: string;
	icon: React.ComponentType<{ size?: number }>;
}

const NAV_GROUPS: Array<{ label: string; items: SectionDef[] }> = [
	{
		label: "Overview",
		items: [{ id: "dashboard", label: "Dashboard", icon: IconGrid }],
	},
	{
		label: "Content",
		items: [
			{ id: "questions", label: "Question bank", icon: IconQuestion },
			{ id: "categories", label: "Categories", icon: IconTag },
			{ id: "ai", label: "AI generate", icon: IconAnalytics },
			{ id: "upload", label: "Bulk import", icon: IconUpload },
			{ id: "review", label: "Review queue", icon: IconBell },
		],
	},
	{
		label: "Platform",
		items: [
			{ id: "users", label: "Users", icon: IconUsers },
			{ id: "analytics", label: "Analytics", icon: IconChartLine },
			{ id: "settings", label: "Settings", icon: IconSettings },
		],
	},
];

const ALL_SECTIONS: SectionDef[] = NAV_GROUPS.flatMap((g) => g.items);'''

s = s[:start] + groups_code + s[end:]

open(p, "w").write(s)
print("step1 done")
