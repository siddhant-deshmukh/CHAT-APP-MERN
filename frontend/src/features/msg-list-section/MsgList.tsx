import useAppContext from "@/hooks/useAppContext";
import { get } from "@/lib/apiCall";
import type { IMsg } from "@/types";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FunctionComponent } from "react";
import MsgCard from "./MsgCard";

interface MsgListProps {
  msgList: IMsg[];
  setMsgList: React.Dispatch<React.SetStateAction<IMsg[]>>;
  messageContainerRef: React.RefObject<HTMLDivElement | null>;
}

const MsgList: FunctionComponent<MsgListProps> = ({ msgList, setMsgList, messageContainerRef }) => {
  const { selectedChat, user } = useAppContext()
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const prevMsgId = useRef<string | undefined>(undefined);
  const allMsgSeen = useRef<boolean>(false);
  const prevScrollHeightRef = useRef<number>(0);
  const loadingOlderMsgsRef = useRef<boolean>(false);

  const fetchNewMsgs = useCallback(() => {
    if (allMsgSeen.current) {
      console.log('No more messages');
      return;
    }

    if (loadingOlderMsgsRef.current) return;

    loadingOlderMsgsRef.current = true
    setLoadingMsgs(true);

    if (messageContainerRef.current) {
      prevScrollHeightRef.current = messageContainerRef.current.scrollHeight;
    }

    get<{ msgs: IMsg[] }>(`${selectedChat?._id}/msg${prevMsgId.current ? `?prev_msg_id=${prevMsgId.current}` : ''}`)
      .then((res) => {
        if (res.msgs.length == 0) {
          allMsgSeen.current = true;
          return;
        }
        const new_msgs = res.msgs.reverse();
        prevMsgId.current = new_msgs[0]._id;

        if (messageContainerRef.current)
          messageContainerRef.current.style.overflow = 'hidden';

        setMsgList(prev => [...new_msgs, ...prev]);

        // setTimeout(()=> {

        // }, 1000);
        requestAnimationFrame(() => {
          const container = messageContainerRef.current;
          if (!container) return;

          const newScrollHeight = container.scrollHeight;
          const scrollDelta = newScrollHeight - prevScrollHeightRef.current;
          container.scrollTop = scrollDelta;

          container.style.overflow = 'auto';
        });
      })
      .finally(() => {
        setLoadingMsgs(false);
        loadingOlderMsgsRef.current = false;
      })
  }, [user, selectedChat?._id, loadingOlderMsgsRef, setLoadingMsgs, setMsgList])

  useEffect(() => {
    const container = messageContainerRef.current;
    allMsgSeen.current = false;
    prevMsgId.current = undefined;
    prevScrollHeightRef.current = 0;
    if (!container || !selectedChat?._id) return;

    setMsgList([]);
    setLoadingMsgs(false);
    fetchNewMsgs();

    // container.scrollTop = 0;

    const handleScroll = () => {
      // Check if scrolled to the very top
      if (container.scrollTop === 0) {
        fetchNewMsgs();
      }
    };

    container.addEventListener('scroll', handleScroll);

    // Clean up the event listener on component unmount
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [selectedChat?._id]);

  // useEffect(() => {
  //   if (loadingMsgs === false && prevScrollHeightRef.current > 0 && messageContainerRef.current && msgList.length > 0) {
  //     const newScrollHeight = messageContainerRef.current.scrollHeight;
  //     const scrollDifference = newScrollHeight - prevScrollHeightRef.current;

  //     //* Adjust scroll position
  //     messageContainerRef.current.scrollTop += scrollDifference;

  //     if (messageContainerRef.current)
  //       messageContainerRef.current.style.overflow = 'auto';

  //     // Reset previous scroll height
  //     prevScrollHeightRef.current = 0;
  //   }
  // }, [loadingMsgs, msgList]); // Depend on loading state and messages


  return (
    <div ref={messageContainerRef} className="max-h-full custom-scrollbar overflow-y-auto px-10 pt-5 pb-24">
      {
        loadingMsgs && (
          <div className="text-center text-blue-500 flex justify-center text-sm mb-2">
            <Loader2 size={25} className="animate-spin" />
          </div>
        )
      }
      {
        msgList.map((msg, index) => {
          if (!msg || !msg.msgAuthor) return <div></div>;

          const { msgAuthor } = msg;

          const isIncoming = !(msgAuthor && user && msgAuthor._id == user._id && user._id);

          const lastMsgSameAuthor = (index === 0 || msg.msgAuthor._id == msgList[index - 1].msgAuthor?._id)

          const isSeen =  ((selectedChat && selectedChat.minLastSeen) ? (new Date(selectedChat?.minLastSeen)) > new Date(msg.createdAt) : false)


          return <MsgCard
            key={msg._id}
            msg={msg}
            isSeen={isSeen}
            isIncoming={isIncoming}
            lastMsgSameAuthor={lastMsgSameAuthor} />
        })
      }
    </div>
  );
}

export default MsgList;