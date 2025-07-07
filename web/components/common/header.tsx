import { Button } from "../ui/button";
import { LogOutIcon } from "lucide-react";

export default function Header() {
    return (
        <header className="flex justify-between items-center p-4 border-b">
            <h1 className="text-2xl font-bold">Phonomorph</h1>
            <div>
                <Button variant="ghost" size="icon" onClick={() => {
                    localStorage.removeItem('walletAddress')
                    localStorage.removeItem('authToken')
                    window.location.href = '/'
                }}>
                    <LogOutIcon />
                </Button>
            </div>
        </header>
    )
}