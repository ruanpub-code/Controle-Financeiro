import AportesModule from './AportesModule'
import CofrinhosModule from './CofrinhosModule'

export default function CofrinhosAportesModule(props) {
  return (
    <div className="stack-panels">
      <CofrinhosModule {...props} config={props.cofrinhosConfig} rows={props.cofrinhosRows} />
      <AportesModule
        {...props}
        config={props.aportesConfig}
        rows={props.aportesRows}
        filterScope="cofrinhos:aportes"
        focusModule="aportes"
      />
    </div>
  )
}
