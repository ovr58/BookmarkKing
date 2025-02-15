import { getCurrentTab } from "./utils";

export async function getTabId() {
    const tab = await getCurrentTab()
    return tab.id
}