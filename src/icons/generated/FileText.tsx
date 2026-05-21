import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
import { memo } from 'react';
const SvgFileText = (props: SvgProps) => (
	<Svg fill="none" viewBox="0 0 24 24" {...props}>
		<Path fill="currentColor" d="M14.25 3v5.25h5.25z" opacity={0.2} />
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M4.188 2.69a1.5 1.5 0 0 1 1.061-.44h9a.75.75 0 0 1 .531.22l5.25 5.25c.14.14.22.331.22.53v12a1.5 1.5 0 0 1-1.5 1.5H5.249a1.5 1.5 0 0 1-1.5-1.5V3.75c0-.398.158-.78.44-1.06m9.751 1.06H5.25v16.5h13.5V8.56z"
			clipRule="evenodd"
		/>
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M14.25 2.25A.75.75 0 0 1 15 3v4.5h4.5a.75.75 0 1 1 0 1.5h-5.25a.75.75 0 0 1-.75-.75V3a.75.75 0 0 1 .75-.75M8.25 12.75A.75.75 0 0 1 9 12h6a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75M8.25 15.75A.75.75 0 0 1 9 15h6a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75"
			clipRule="evenodd"
		/>
	</Svg>
);
const Memo = memo(SvgFileText);
export default Memo;
