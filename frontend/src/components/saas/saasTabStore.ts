import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SAAS_APPS, type SaasApp } from './saasApps';

export interface SaasTabItem {
    id: string;
    title: string;
    shortTitle: string;
    path: string;
    iconName: string;
    gradient: string;
}

interface SaasTabState {
    tabs: SaasTabItem[];
    activeTabId: string | null;
    openTab: (app: SaasApp) => void;
    closeTab: (tabId: string) => string;
    closeAllTabs: () => void;
    setActiveTab: (tabId: string) => void;
    syncWithRoute: (pathname: string) => void;
}

export const useSaasTabStore = create<SaasTabState>()(
    persist(
        (set, get) => ({
            tabs: [],
            activeTabId: null,

            openTab: (app: SaasApp) => {
                const { tabs } = get();
                const existing = tabs.find(t => t.id === app.id);
                if (existing) {
                    set({ activeTabId: app.id });
                    return;
                }
                const newTab: SaasTabItem = {
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

                let nextPath = '/admin';
                let nextActiveId: string | null = null;

                if (activeTabId === tabId) {
                    if (updatedTabs.length > 0) {
                        const newActiveIndex = Math.min(tabIndex, updatedTabs.length - 1);
                        const nextTab = updatedTabs[newActiveIndex];
                        nextActiveId = nextTab.id;
                        nextPath = nextTab.path;
                    } else {
                        nextActiveId = null;
                        nextPath = '/admin';
                    }
                } else {
                    nextActiveId = activeTabId;
                    const curTab = updatedTabs.find(t => t.id === activeTabId);
                    nextPath = curTab ? curTab.path : '/admin';
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

            syncWithRoute: (pathname: string) => {
                if (pathname === '/admin' || pathname === '/admin/') {
                    set({ activeTabId: null });
                    return;
                }
                const matchingApp = SAAS_APPS.find(app => app.path === pathname);
                if (!matchingApp) return;

                const { tabs } = get();
                const exists = tabs.some(t => t.id === matchingApp.id);
                if (!exists) {
                    const newTab: SaasTabItem = {
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
            name: 'pegasus_saas_browser_tabs',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);
