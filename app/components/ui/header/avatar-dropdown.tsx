import Button from "~/src/general/Button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import React, { useEffect, useState } from "react";


export function AvatarDropdown() {
    const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/user-info", {
      credentials: "include"
    })
      .then(res => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then(data => setUser(data))
      .catch(() => setUser(null));
  }, []);
  return (
    <DropdownMenu>
        <nav className="hidden md:flex gap-4 text-sm ">
              {user?.name}
        </nav>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar>
                    <AvatarImage src={user?.picture} />
                    <AvatarFallback> {user?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
            </Button>
        </DropdownMenuTrigger>
            <DropdownMenuContent className="w-32">
                <DropdownMenuGroup>
                    <DropdownMenuItem>Profile</DropdownMenuItem>
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem variant="destructive">Log out</DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
    </DropdownMenu>
    
  )
}