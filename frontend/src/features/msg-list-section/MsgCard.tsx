import React from "react";
import type { IMsg } from "@/types";
import type { FunctionComponent } from "react";
import { CheckCheck } from "lucide-react";

interface MsgCardProps {
  msg: IMsg;
  isIncoming: boolean;
  lastMsgSameAuthor: boolean;
  isSeen: boolean;
}

const MessageTailSVG = () => (
  <svg viewBox="0 0 8 13" height="13" width="8" preserveAspectRatio="xMidYMid meet" className="fill-current">
    <title>tail-in</title>
    <path d="M1.533,2.568L8,11.193V0L2.812,0C1.042,0,0.474,1.156,1.533,2.568z"></path>
  </svg>
);

const MessageTailSVG2 = () => {
  return <svg viewBox="0 0 8 13" height="13" width="8" preserveAspectRatio="xMidYMid meet" className="" version="1.1" x="0px" y="0px" enableBackground="new 0 0 8 13">
    <title>tail-out</title><path opacity="0.13" d="M5.188,1H0v11.193l6.467-8.625 C7.526,2.156,6.958,1,5.188,1z"></path><path fill="currentColor" d="M5.188,0H0v11.193l6.467-8.625C7.526,1.156,6.958,0,5.188,0z"></path></svg>
}

const MsgCard: FunctionComponent<MsgCardProps> = ({ msg: { createdAt, text: message }, isIncoming, isSeen, lastMsgSameAuthor }) => {

  const bubbleClasses = isIncoming
    ? `bg-[#242626] ${ lastMsgSameAuthor ? '': 'rounded-tl-none'  }` 
    : `bg-secondary-1 ${ lastMsgSameAuthor ? '': 'rounded-tr-none'  }`; 

  const tailClasses = isIncoming
    ? 'text-[#242626] absolute top-0 -left-2 '
    : 'text-secondary-1 absolute top-0 -right-2 ';

  const messageAlignment = isIncoming ? 'justify-start' : 'justify-end';
  const messageContainerOrder = isIncoming ? 'order-1' : 'order-2';
  const tailOrder = isIncoming ? 'order-2' : 'order-1'; // Adjust margin to overlap slightly for seamless look

  const timestamp = (new Date(createdAt)).toTimeString().slice(0,5);
  return (
    <div className={`flex items-end ${messageAlignment} ${!lastMsgSameAuthor ? 'mt-2.5' : 'mt-1.5'}`}>
      {/* Message content */}
      <div className={`relative flex max-w-xs sm:max-w-md lg:max-w-lg p-2.5 pb-5 rounded-lg shadow-sm ${bubbleClasses} ${messageContainerOrder}`}>
        <div>
          <p className="text-sm break-words text-foreground pr-10">
            {message}
          </p>
          <div className="text-right flex items-center text-xs text-foreground-1 mt-1 absolute bottom-1 right-2">
            <span className="text-primary/60" >{timestamp}</span>
            { !isIncoming && <CheckCheck className={`w-6 h-4 ${isSeen ? 'text-blue-400':'text-primary/60' }`} /> }
          </div>
        </div>
        <div className={`flex-shrink-0 ${tailOrder} ${tailClasses}`}>
          { isIncoming && !lastMsgSameAuthor && <MessageTailSVG />}
          { !isIncoming && !lastMsgSameAuthor && <MessageTailSVG2 /> }
        </div>
      </div>

    </div>
  );
}

export default React.memo(MsgCard);