import { Button } from "@/components/ui/button";
import useAppContext from "@/hooks/useAppContext";
import { post } from "@/lib/apiCall";
import { useCallback, useEffect, useRef, type FunctionComponent } from "react";
import { IoSend } from "react-icons/io5";

interface NewMsgInputProps {
  handleNewMessage: (newMsg: any) => void
}

const NewMsgInput: FunctionComponent<NewMsgInputProps> = ({ handleNewMessage }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { selectedChat, user, setSelectedChat } = useAppContext()

  const addNewMsg = useCallback(() => {
    if (inputRef.current) {
      post<any, any>(`${selectedChat?._id}/msg`, {
        text: inputRef.current.value,
        type: 'text'
      }).then((res) => {
        if(res.totalChatMembers && res.minLastSeen) {
          setSelectedChat((prev)=> {
            if(!prev) return prev;
            return {
              ...prev,
              totalChatMembers: res.totalChatMembers as number,
              minLastSeen: res.minLastSeen as string
            }
          });
        }
        if(res.msg) {
          handleNewMessage(res.msg)
        }
        if (inputRef.current)
          inputRef.current.value = '';

      })
    }
  }, [selectedChat?._id, user])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [selectedChat?._id]);

  return (
    <div className='flex shadow border space-x-2 p-1.5 rounded-full bg-[#242626]'>
      <input ref={inputRef} className='w-full ml-5 placeholder:text-[#a7a8a8] outline-none border-none' placeholder='Enter the Msg'></input>
      <Button onClick={addNewMsg} className='rounded-full overflow-hidden h-10 w-10 bg-[#21c063]'>
        <IoSend className="my-1.5"></IoSend>
      </Button>
    </div>
  );
}

export default NewMsgInput;