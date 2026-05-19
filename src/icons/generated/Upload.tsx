import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
import { memo } from 'react';
const SvgUpload = (props: SvgProps) => (
	<Svg fill="none" viewBox="0 0 24 24" {...props}>
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M11.47 3.217a.75.75 0 0 1 1.06 0l3.938 3.937a.75.75 0 0 1-1.06 1.061L12 4.808 8.593 8.215a.75.75 0 1 1-1.06-1.06z"
			clipRule="evenodd"
		/>
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M12 3a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-1.5 0V3.75A.75.75 0 0 1 12 3"
			clipRule="evenodd"
		/>
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M3 12a.75.75 0 0 1 .75.75v6.75h16.5v-6.75a.75.75 0 0 1 1.5 0v6.75a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5v-6.75A.75.75 0 0 1 3 12"
			clipRule="evenodd"
		/>
	</Svg>
);
const Memo = memo(SvgUpload);
export default Memo;
