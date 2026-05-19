import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
import { memo } from 'react';
const SvgTelegram = (props: SvgProps) => (
	<Svg fill="none" viewBox="0 0 24 24" {...props}>
		<Path
			stroke="#89898F"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M11 13 2 9l20-7-7 20zM22 2 11 13"
		/>
	</Svg>
);
const Memo = memo(SvgTelegram);
export default Memo;
