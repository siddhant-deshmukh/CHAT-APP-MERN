import { LoaderIcon } from "lucide-react";
import NavBar from "./components/Navbar";
import AuthForm from "./features/auth/AuthPage";
import ChatList from "./features/chat-list-section/ChatList"
import MsgListSection from "./features/msg-list-section/MsgListSection"
import useAppContext from "./hooks/useAppContext"

function App() {
  const { user, authLoading } = useAppContext();
  return (
    <div className="w-full dark bg-background text-foreground h-screen flex">
      {
        authLoading &&
        <LoaderIcon className="animate-spin w-20 h-20 mx-auto mt-[20vh]" />
      }
      {
        !user && !authLoading &&
        <AuthForm />
      }
      {
        user && !authLoading &&
        <div className="flex w-full">
          <NavBar />
          <div className="h-full w-[30%] border-r border-border">
            <ChatList />
          </div>
          <div className="h-full w-full ">
            <MsgListSection />
          </div>
        </div>
      }
    </div>
  )
}

export default App