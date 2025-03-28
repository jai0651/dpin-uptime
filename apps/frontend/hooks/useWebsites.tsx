"use client";
import { useApi } from "@/utils/api";
import { useEffect, useState } from "react";

interface Website {
    id: string;
    url: string;
    ticks: {
        id: string;
        createdAt: string;
        status: string;
        latency: number;
    }[];
}

export function useWebsites() {
    const { api } = useApi();
    const [websites, setWebsites] = useState<Website[]>([]);

    async function refreshWebsites() {
        try {
            const response = await api.get(`/api/v1/websites`);
            setWebsites(response.data.websites);
        } catch (error) {
            console.error("Error fetching websites:", error);
        }
    }

    useEffect(() => {
        refreshWebsites();

        const interval = setInterval(() => {
            refreshWebsites();
        }, 1000 * 60 * 1);

        return () => clearInterval(interval);
    }, []);

    return { websites, refreshWebsites };
}