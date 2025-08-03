import { Button } from "@/components/ui/button";
import useAppContext from "@/hooks/useAppContext";
import { post } from "@/lib/apiCall";
import type { IMsg } from "@/types";
import { useCallback, useEffect, useRef, type FunctionComponent } from "react";
import { IoSend } from "react-icons/io5";

interface NewMsgInputProps {
  setMsgList: React.Dispatch<React.SetStateAction<IMsg[]>>;
  messageContainerRef: React.RefObject<HTMLDivElement | null>
}

const NewMsgInput: FunctionComponent<NewMsgInputProps> = ({ setMsgList, messageContainerRef }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { selectedChat, user } = useAppContext()

  const addNewMsg = useCallback(() => {
    if (inputRef.current) {
      post<any, any>(`${selectedChat?._id}/msg`, {
        text: inputRef.current.value,
        type: 'text'
      }).then((res) => {
        setMsgList((prev) => {
          return [...prev, {
            msgAuthor: user,
            ...res.msg
          }];
        })

        if (inputRef.current)
          inputRef.current.value = '';

        const container = messageContainerRef.current;
        if (container) {
          const threshold = window.innerHeight;
          const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

          if (distanceFromBottom <= threshold) {
            // Wait for DOM to update before scrolling
            requestAnimationFrame(() => {
              setTimeout(() => {
                container.scrollTop = container.scrollHeight;
              }, 10);
            });
          }
        }
      })
    }
  }, [setMsgList, selectedChat, user])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [selectedChat]);

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