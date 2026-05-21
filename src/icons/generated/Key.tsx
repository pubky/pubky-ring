import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
import { memo } from 'react';
const SvgKey = (props: SvgProps) => (
	<Svg fill="none" viewBox="0 0 24 24" {...props}>
		<Path
			fill="currentColor"
			d="M8.734 11.516a6.744 6.744 0 1 1 3.75 3.75L11.25 16.5H9v2.25H6.75V21H3v-3.75z"
			opacity={0.2}
		/>
		<Path fill="currentColor" d="M16.875 8.25a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25" />
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M15.599 3.043a5.994 5.994 0 0 0-6.175 8.176.75.75 0 0 1-.16.827L3.75 17.56v2.69H6v-1.5a.75.75 0 0 1 .75-.75h1.5v-1.5a.75.75 0 0 1 .75-.75h1.94l1.014-1.016a.75.75 0 0 1 .825-.159A5.994 5.994 0 1 0 15.6 3.043m-2.921 13.09a7.494 7.494 0 1 0-4.811-4.81L2.47 16.72a.75.75 0 0 0-.22.53V21c0 .414.336.75.75.75h3.75A.75.75 0 0 0 7.5 21v-1.5H9a.75.75 0 0 0 .75-.75v-1.5h1.5a.75.75 0 0 0 .53-.22z"
			clipRule="evenodd"
		/>
	</Svg>
);
const Memo = memo(SvgKey);
export default Memo;
