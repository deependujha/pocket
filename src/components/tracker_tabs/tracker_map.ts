import { IconType } from "react-icons";
import { FiHome, FiBarChart2, FiClock, FiMoreHorizontal, FiDollarSign } from "react-icons/fi";

import { HistoryTab } from "./history/history";
import { MoreTab } from "./more/more";
import { StatsTab } from "./stats/stats";
import { TodayTab } from "./today/today";
import { Scanner } from "../scanner/scanner";

type TrackerTabConfig = {
    component: React.FC;
    icon: IconType;
    label: string;
};

export const TrackerTabMap: Record<string, TrackerTabConfig> = {
    scanner: {
        component: Scanner,
        icon: FiDollarSign,
        label: "Scanner",
    },
    today: {
        component: TodayTab,
        icon: FiHome,
        label: "Today",
    },
    stats: {
        component: StatsTab,
        icon: FiBarChart2,
        label: "Stats",
    },
    history: {
        component: HistoryTab,
        icon: FiClock,
        label: "History",
    },
    more: {
        component: MoreTab,
        icon: FiMoreHorizontal,
        label: "More",
    },
};
