import { compose } from "./compose";
import withApiKey from "./withApiKey";
import withPostOnly from "./withPostOnly";

const pipeline = compose(
    withPostOnly,
    withApiKey
);

export default pipeline;