import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
import { memo } from 'react';
const SvgImage = (props: SvgProps) => (
	<Svg fill="none" viewBox="0 0 24 24" {...props}>
		<Path
			fill="currentColor"
			d="M3.75 16.5v-12a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 .75.75V15l-3.97-3.97a.75.75 0 0 0-1.06 0l-4.19 4.19a.75.75 0 0 1-1.06 0l-1.94-1.94a.75.75 0 0 0-1.06 0z"
			opacity={0.2}
		/>
		<Path fill="currentColor" d="M9.375 9.75a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25" />
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M3 4.5A1.5 1.5 0 0 1 4.5 3h15A1.5 1.5 0 0 1 21 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5zm16.5 0h-15v15h15z"
			clipRule="evenodd"
		/>
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M14.69 10.5a1.5 1.5 0 0 1 2.12 0l-.53.53.53-.53 3.97 3.97a.75.75 0 0 1-1.06 1.06l-3.97-3.97-4.19 4.19a1.5 1.5 0 0 1-2.12 0L7.5 13.81l-3.22 3.22a.75.75 0 0 1-1.06-1.06l3.22-3.22.504.505-.505-.505a1.5 1.5 0 0 1 2.122 0l-.53.53.53-.53 1.939 1.94z"
			clipRule="evenodd"
		/>
	</Svg>
);
const Memo = memo(SvgImage);
export default Memo;
