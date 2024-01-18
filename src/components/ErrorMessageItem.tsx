import IconRefresh from "./icons/Refresh.tsx"
import type { ErrorMessage } from '../../types'
import './Notice.module.css'

interface Props {
  data: ErrorMessage
  onRetry?: () => void
}

export default ({ data, onRetry }: Props) => {
  return (
    <div class="footer">
      {data.code && <div>{data.code}</div>}
      <div>{data.message}</div>
      {onRetry && (
        <div>
          <div onClick={onRetry} class="links">
            <IconRefresh />
            <span>Regenerate</span>
          </div>
        </div>
      )}
    </div>
  )
}
