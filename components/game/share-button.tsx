
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Facebook, Twitter } from "lucide-react";

const ShareButton = ({ platform, text }: { platform: 'whatsapp' | 'facebook' | 'x', text: string }) => {
    const [appUrl, setAppUrl] = useState("");

    useEffect(() => {
        // This code will only run on the client, after the component has mounted.
        if (typeof window !== "undefined") {
            setAppUrl(window.location.href);
        }
    }, []); // The empty dependency array ensures this runs only once.

    const platforms = {
        whatsapp: {
            url: `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + appUrl)}`,
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>,
            label: "WhatsApp"
        },
        facebook: {
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}&quote=${encodeURIComponent(text)}`,
            icon: <Facebook className="h-4 w-4" />,
            label: "Facebook"
        },
        x: {
            url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(text)}`,
            icon: <Twitter className="h-4 w-4" />,
            label: "X"
        }
    }

    const handleShare = () => {
        if (appUrl) {
            window.open(platforms[platform].url, '_blank');
        }
    }

    return (
        <Button onClick={handleShare} variant="outline" size="sm" disabled={!appUrl}>
        {platforms[platform].icon}
        <span className="ml-2">{platforms[platform].label}</span>
        </Button>
    )
}

export default ShareButton;
