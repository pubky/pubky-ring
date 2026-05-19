import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
import { memo } from 'react';
const SvgPhone = (props: SvgProps) => (
	<Svg fill="none" viewBox="0 0 24 24" {...props}>
		<Path fill="currentColor" d="M18 5.25H6v13.5h12z" opacity={0.2} />
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M7.5 3a.75.75 0 0 0-.75.75v16.5c0 .414.336.75.75.75h9a.75.75 0 0 0 .75-.75V3.75A.75.75 0 0 0 16.5 3zm-2.25.75A2.25 2.25 0 0 1 7.5 1.5h9a2.25 2.25 0 0 1 2.25 2.25v16.5a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25z"
			clipRule="evenodd"
		/>
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M5.25 5.25A.75.75 0 0 1 6 4.5h12A.75.75 0 0 1 18 6H6a.75.75 0 0 1-.75-.75M5.25 18.75A.75.75 0 0 1 6 18h12a.75.75 0 0 1 0 1.5H6a.75.75 0 0 1-.75-.75"
			clipRule="evenodd"
		/>
	</Svg>
);
const Memo = memo(SvgPhone);
export default Memo;
