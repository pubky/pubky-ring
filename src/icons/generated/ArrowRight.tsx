import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
import { memo } from 'react';
const SvgArrowRight = (props: SvgProps) => (
	<Svg fill="none" viewBox="0 0 24 24" {...props}>
		<Path
			fill="currentColor"
			fillOpacity={0.64}
			fillRule="evenodd"
			d="M8.47 4.72a.75.75 0 0 1 1.06 0l6.75 6.75a.75.75 0 0 1 0 1.06l-6.75 6.75a.75.75 0 0 1-1.06-1.06L14.69 12 8.47 5.78a.75.75 0 0 1 0-1.06"
			clipRule="evenodd"
		/>
	</Svg>
);
const Memo = memo(SvgArrowRight);
export default Memo;
