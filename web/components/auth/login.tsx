"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
    const router = useRouter();
    const [countryCode, setCountryCode] = useState("1");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const fullPhoneNumber = "+" + countryCode + phoneNumber;

            const response = await fetch(`http://localhost:8000/mock-auth/send?phoneNumber=${encodeURIComponent(fullPhoneNumber)}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                // Save phone number to localStorage for verification step
                localStorage.setItem('phoneNumber', fullPhoneNumber);
                router.push('/verify');
            } else {
                console.error("Login failed:", response.statusText);
            }
        } catch (error) {
            console.error("Error calling server:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
                <div className="flex gap-2">
                    <Select value={countryCode} onValueChange={setCountryCode} required>
                        <SelectTrigger className="w-24">
                            <SelectValue placeholder="Code" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1"><span className="text-red-500">🇺🇸</span> +1</SelectItem>
                            <SelectItem value="44"><span className="text-red-500">🇬🇧</span> +44</SelectItem>
                            <SelectItem value="34"><span className="text-red-500">🇪🇸</span> +34</SelectItem>
                            <SelectItem value="33"><span className="text-red-500">🇫🇷</span> +33</SelectItem>
                            <SelectItem value="49"><span className="text-red-500">🇩🇪</span> +49</SelectItem>
                            <SelectItem value="39"><span className="text-red-500">🇮🇹</span> +39</SelectItem>
                            <SelectItem value="31"><span className="text-red-500">🇳🇱</span> +31</SelectItem>
                            <SelectItem value="46"><span className="text-red-500">🇸🇪</span> +46</SelectItem>
                            <SelectItem value="47"><span className="text-red-500">🇳🇴</span> +47</SelectItem>
                            <SelectItem value="45"><span className="text-red-500">🇩🇰</span> +45</SelectItem>
                            <SelectItem value="41"><span className="text-red-500">🇨🇭</span> +41</SelectItem>
                            <SelectItem value="43"><span className="text-red-500">🇦🇹</span> +43</SelectItem>
                            <SelectItem value="32"><span className="text-red-500">🇧🇪</span> +32</SelectItem>
                            <SelectItem value="351"><span className="text-red-500">🇵🇹</span> +351</SelectItem>
                            <SelectItem value="61"><span className="text-red-500">🇦🇺</span> +61</SelectItem>
                            <SelectItem value="81"><span className="text-red-500">🇯🇵</span> +81</SelectItem>
                            <SelectItem value="82"><span className="text-red-500">🇰🇷</span> +82</SelectItem>
                            <SelectItem value="86"><span className="text-red-500">🇨🇳</span> +86</SelectItem>
                            <SelectItem value="91"><span className="text-red-500">🇮🇳</span> +91</SelectItem>
                            <SelectItem value="55"><span className="text-red-500">🇧🇷</span> +55</SelectItem>
                            <SelectItem value="52"><span className="text-red-500">🇲🇽</span> +52</SelectItem>
                            <SelectItem value="54"><span className="text-red-500">🇦🇷</span> +54</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input 
                        type="tel" 
                        placeholder="Phone Number" 
                        className="flex-1"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                    />
                </div>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Code"}
                </Button>
            </form>
        </div>
    )
}