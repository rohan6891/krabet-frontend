import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faTwitter, faTelegram } from "@fortawesome/free-brands-svg-icons";

interface AuthSocialButtonsProps {
  onGoogleClick: () => void;
  onTwitterClick: () => void;
  onTelegramClick: () => void;
  telegramWidgetOpen: boolean;
  telegramWidgetContainerId: string;
}

export function AuthSocialButtons({
  onGoogleClick,
  onTwitterClick,
  onTelegramClick,
  telegramWidgetOpen,
  telegramWidgetContainerId,
}: AuthSocialButtonsProps) {
  return (
    <>
      <div className="socials">
        <button type="button" aria-label="Continue with Google" onClick={onGoogleClick}>
          <FontAwesomeIcon icon={faGoogle} />
        </button>

        <button type="button" aria-label="Continue with Twitter" onClick={onTwitterClick}>
          <FontAwesomeIcon icon={faTwitter} />
        </button>

        {/* 
        <button type="button" aria-label="Continue with Telegram" onClick={onTelegramClick}>
          <FontAwesomeIcon icon={faTelegram} />
        </button>
        */}
      </div>

      <div
        id={telegramWidgetContainerId}
        className="telegram-widget-wrap"
        style={{ display: telegramWidgetOpen ? "block" : "none" }}
      />
    </>
  );
}
