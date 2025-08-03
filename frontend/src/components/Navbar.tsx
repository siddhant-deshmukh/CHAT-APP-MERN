import useAppContext from "@/hooks/useAppContext";
import { FaUser } from "react-icons/fa";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { CreateNewChatDialog } from "@/features/chat/CreationForm/CreateNewChatDialog";

function NavBar() {

  const { setUser, user } = useAppContext();

  return (
    <div className="flex flex-col justify-end px-1 border-r py-10">
      <CreateNewChatDialog />
      <DropdownMenu>
        <DropdownMenuTrigger>
          <div className="p-2.5 border rounded-full mt-2 outline-1 outline-white overflow-hidden">
            < FaUser className="w-4 h-4 " />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="ml-10 -mt-5" >
          {
            user && 
            <>
              <DropdownMenuLabel>User Details</DropdownMenuLabel>
              <DropdownMenuItem>{user.name}</DropdownMenuItem>
              <DropdownMenuItem>@{user.user_name}</DropdownMenuItem>
            </>
          }
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="!hover:bg-red-300" 
            onClick={()=> { 
              setUser(null); 
              localStorage.removeItem('authToken');
              }}>
                Logout
              </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default NavBar