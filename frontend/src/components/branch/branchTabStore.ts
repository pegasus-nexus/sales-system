import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BRANCH_APPS, type BranchApp } from './branchApps';

export interface BranchTabItem {
    id: string;
    title: string;
    shortTitle: string;
    path: string;
    iconName: string;
    gradient: string;
}

interface BranchTabState {
    tabs: BranchTabItem[];
    activeTabId: string | null;
    isWorkspaceMode: boolean;
    setWorkspaceMode: (enabled: boolean) => void;
    openTab: (app: BranchApp) => void;
    closeTab: (tabId: string) => string;
    closeAllTabs: () => void;
    setActiveTab: (tabId: string) => void;
    syncWithRoute: (pathname: string, search?: string) => void;
}

export const useBranchTabStore = create<BranchTabState>()(
    persist(
        (set, get) => ({
            tabs: [],
            activeTabId: null,
            isWorkspaceMode: true,

            setWorkspaceMode: (enabled: boolean) => {
                set({ isWorkspaceMode: enabled });
            },

            openTab: (app: BranchApp) => {
                const { tabs } = get();
                const existing = tabs.find(t => t.id === app.id);
                if (existing) {
                    set({ activeTabId: app.id });
                    return;
                }
                const newTab: BranchTabItem = {
                    id: app.id,
                    title: app.title,
                    shortTitle: app.shortTitle || app.title,
                    path: app.path,
                    iconName: app.id,
                    gradient: app.gradient,
                };
                set({
                    tabs: [...tabs, newTab],
                    activeTabId: app.id,
                });
            },

            closeTab: (tabId: string) => {
                const { tabs, activeTabId } = get();
                const tabIndex = tabs.findIndex(t => t.id === tabId);
                const updatedTabs = tabs.filter(t => t.id !== tabId);

                let nextPath = '/apps';
                let nextActiveId: string | null = null;

                if (activeTabId === tabId) {
                    if (updatedTabs.length > 0) {
                        const newActiveIndex = Math.min(tabIndex, updatedTabs.length - 1);
                        const nextTab = updatedTabs[newActiveIndex];
                        nextActiveId = nextTab.id;
                        nextPath = nextTab.path;
                    } else {
                        nextActiveId = null;
                        nextPath = '/apps';
                    }
                } else {
                    nextActiveId = activeTabId;
                    const curTab = updatedTabs.find(t => t.id === activeTabId);
                    nextPath = curTab ? curTab.path : '/apps';
                }

                set({
                    tabs: updatedTabs,
                    activeTabId: nextActiveId,
                });

                return nextPath;
            },

            closeAllTabs: () => {
                set({ tabs: [], activeTabId: null });
            },

            setActiveTab: (tabId: string) => {
                set({ activeTabId: tabId });
            },

            syncWithRoute: (pathname: string, search: string = '') => {
                const fullPath = search ? `${pathname}${search}` : pathname;

                if (pathname === '/apps' || pathname === '/apps/') {
                    set({ activeTabId: null });
                    return;
                }

                // Buscar app exacta por ruta completa o base
                const matchingApp =
                    BRANCH_APPS.find(app => app.path === fullPath) ||
                    BRANCH_APPS.find(app => app.path.split('?')[0] === pathname);

                if (!matchingApp) return;

                const { tabs } = get();
                const exists = tabs.some(t => t.id === matchingApp.id);

                if (!exists) {
                    const newTab: BranchTabItem = {
                        id: matchingApp.id,
                        title: matchingApp.title,
                        shortTitle: matchingApp.shortTitle || matchingApp.title,
                        path: matchingApp.path,
                        iconName: matchingApp.id,
                        gradient: matchingApp.gradient,
                    };
                    set({
                        tabs: [...tabs, newTab],
                        activeTabId: matchingApp.id,
                    });
                } else {
                    set({ activeTabId: matchingApp.id });
                }
            },
        }),
        {
            name: 'pegasus_branch_tab_storage',
        }
    )
);
