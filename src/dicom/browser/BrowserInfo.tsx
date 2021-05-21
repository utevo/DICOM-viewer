import { VoiLutModule } from "../domain/common";
import { ViewPort, WindowingOffset } from "./common";

type Props = {
  viewPort: ViewPort;
  voiLutModule?: VoiLutModule;
  voiLutModuleOffset?: WindowingOffset;

  className?: string;
};

export const BrowserInfo = ({ viewPort, voiLutModule, voiLutModuleOffset, className }: Props): React.ReactElement => {
  return (
    <ul className={className}>
      <li>View Port: {JSON.stringify(viewPort)}</li>
      {voiLutModule && <li>VOI LUT Module: {JSON.stringify(voiLutModule)}</li>}
      {voiLutModuleOffset && <li>Windowing Offset: {JSON.stringify(voiLutModuleOffset)}</li>}
    </ul>
  );
};