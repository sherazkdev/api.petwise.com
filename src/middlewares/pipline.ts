import { compose } from "./compose";
import withRatLimit from "./withRateLimit";
import withApiKey from "./withApiKey";
import withPostOnly from "./withPostOnly";

const pipeline = compose(
    withRatLimit,
    withPostOnly,
    withApiKey
);

export default pipeline;