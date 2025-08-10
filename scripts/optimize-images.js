const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directory constants
const DIRS = {
	ORIGINAL: path.join(__dirname, '../src/images/original'),
	OPTIMIZED: path.join(__dirname, '../src/images'),
};

// Image size thresholds
const SIZE_THRESHOLDS = {
	CRITICAL: 500 * 1024,  // 500KB
	WARNING: 100 * 1024,   // 100KB
};

/**
 * Setup directories
 */
function setupDirectories() {
	// Create original images directory if it doesn't exist
	if (!fs.existsSync(DIRS.ORIGINAL)) {
		fs.mkdirSync(DIRS.ORIGINAL, { recursive: true });
		console.log(`Created original images directory: ${DIRS.ORIGINAL}`);
	}

	// Ensure optimized directory exists
	if (!fs.existsSync(DIRS.OPTIMIZED)) {
		fs.mkdirSync(DIRS.OPTIMIZED, { recursive: true });
	}
}

/**
 * Check if a command exists
 */
function commandExists(command) {
	try {
		execSync(`which ${command}`, { stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
}

/**
 * Get available optimization tools
 */
function getAvailableTools() {
	const tools = {
		pngquant: commandExists('pngquant'),
		optipng: commandExists('optipng'),
		sharp: false, // Will check via npm
	};

	// Check if sharp-cli is available
	try {
		execSync('npx sharp --version', { stdio: 'ignore' });
		tools.sharp = true;
	} catch {
		tools.sharp = false;
	}

	return tools;
}

/**
 * Get all image files recursively
 */
function getImageFiles(dir, basePath = '') {
	const files = [];
	const items = fs.readdirSync(dir, { withFileTypes: true });

	for (const item of items) {
		const fullPath = path.join(dir, item.name);
		const relativePath = path.join(basePath, item.name);

		if (item.isDirectory()) {
			files.push(...getImageFiles(fullPath, relativePath));
		} else if (item.name.match(/\.(png|jpg|jpeg)$/i)) {
			files.push({
				name: item.name,
				fullPath: fullPath,
				relativePath: relativePath,
				size: fs.statSync(fullPath).size
			});
		}
	}

	return files;
}

/**
 * Check if image needs optimization
 */
function needsOptimization(originalPath, optimizedPath) {
	// If optimized version doesn't exist, needs optimization
	if (!fs.existsSync(optimizedPath)) {
		return true;
	}

	// If source is newer than optimized, needs re-optimization
	const originalStats = fs.statSync(originalPath);
	const optimizedStats = fs.statSync(optimizedPath);
	return originalStats.mtime > optimizedStats.mtime;
}

/**
 * Format file size for display
 */
function formatSize(bytes) {
	if (bytes < 1024) return `${bytes}B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

/**
 * Optimize image using pngquant
 */
function optimizeWithPngquant(inputPath, outputPath) {
	console.log('  Using pngquant...');
	try {
		execSync(`pngquant --quality=65-80 --force --output "${outputPath}" "${inputPath}"`, {
			stdio: 'pipe'
		});
		return true;
	} catch (error) {
		console.error('  pngquant failed:', error.message);
		return false;
	}
}

/**
 * Optimize image using optipng
 */
function optimizeWithOptipng(inputPath, outputPath) {
	console.log('  Using optipng...');
	try {
		// First copy the file, then optimize in place
		fs.copyFileSync(inputPath, outputPath);
		execSync(`optipng -o5 "${outputPath}"`, {
			stdio: 'pipe'
		});
		return true;
	} catch (error) {
		console.error('  optipng failed:', error.message);
		return false;
	}
}

/**
 * Optimize image using sharp-cli
 */
function optimizeWithSharp(inputPath, outputPath) {
	console.log('  Using sharp-cli...');
	try {
		execSync(`npx sharp -i "${inputPath}" -o "${outputPath}" --compressionLevel 9`, {
			stdio: 'pipe'
		});
		return true;
	} catch (error) {
		console.error('  sharp-cli failed:', error.message);
		return false;
	}
}

/**
 * Optimize JPEG using sharp
 */
function optimizeJpegWithSharp(inputPath, outputPath) {
	console.log('  Using sharp-cli for JPEG...');
	try {
		execSync(`npx sharp -i "${inputPath}" -o "${outputPath}" --quality 85 --mozjpeg`, {
			stdio: 'pipe'
		});
		return true;
	} catch (error) {
		console.error('  sharp-cli JPEG failed:', error.message);
		return false;
	}
}

/**
 * Optimize a single image
 */
function optimizeImage(image, outputPath, tools) {
	const dir = path.dirname(outputPath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	console.log(`\nOptimizing ${image.relativePath} (${formatSize(image.size)})...`);

	let optimized = false;
	const isPng = image.name.toLowerCase().endsWith('.png');
	const isJpeg = image.name.match(/\.(jpg|jpeg)$/i);

	if (isPng) {
		// Try pngquant first (best compression for PNG)
		if (tools.pngquant) {
			optimized = optimizeWithPngquant(image.fullPath, outputPath);
		}

		// Try optipng if pngquant failed or not available
		if (!optimized && tools.optipng) {
			optimized = optimizeWithOptipng(image.fullPath, outputPath);
		}

		// Try sharp if others failed
		if (!optimized && tools.sharp) {
			optimized = optimizeWithSharp(image.fullPath, outputPath);
		}
	} else if (isJpeg && tools.sharp) {
		// For JPEG, use sharp with mozjpeg
		optimized = optimizeJpegWithSharp(image.fullPath, outputPath);
	}

	// If no optimization was possible, just copy the file
	if (!optimized) {
		console.log('  No optimization available, copying original...');
		fs.copyFileSync(image.fullPath, outputPath);
		return { original: image.size, optimized: image.size, copied: true };
	}

	const newSize = fs.statSync(outputPath).size;
	const reduction = ((image.size - newSize) / image.size * 100).toFixed(1);
	console.log(`  ✓ Reduced to ${formatSize(newSize)} (${reduction}% reduction)`);
	return { original: image.size, optimized: newSize, copied: false };
}

/**
 * Move existing images to original folder if needed
 */
function moveExistingImages() {
	const existingImages = fs.readdirSync(DIRS.OPTIMIZED)
		.filter(file => file.match(/\.(png|jpg|jpeg)$/i) && file !== 'backup');

	let movedCount = 0;
	
	existingImages.forEach(file => {
		const currentPath = path.join(DIRS.OPTIMIZED, file);
		const originalPath = path.join(DIRS.ORIGINAL, file);
		
		// Only move if it doesn't already exist in original
		if (!fs.existsSync(originalPath)) {
			fs.copyFileSync(currentPath, originalPath);
			movedCount++;
			console.log(`  Backed up: ${file}`);
		}
	});

	if (movedCount > 0) {
		console.log(`✓ Backed up ${movedCount} existing images to original folder`);
	}
	
	return existingImages.length > 0;
}

/**
 * Generate optimization report
 */
function generateReport(results) {
	const optimizedResults = results.filter(r => r && !r.copied);
	const copiedResults = results.filter(r => r && r.copied);
	
	const totalOriginal = results.reduce((sum, r) => sum + (r?.original || 0), 0);
	const totalOptimized = results.reduce((sum, r) => sum + (r?.optimized || 0), 0);
	const totalReduction = totalOriginal - totalOptimized;
	const reductionPercent = totalOriginal > 0 ? (totalReduction / totalOriginal * 100).toFixed(1) : 0;

	console.log('\n' + '='.repeat(50));
	console.log('OPTIMIZATION COMPLETE');
	console.log('='.repeat(50));
	console.log(`Images processed:     ${results.length}`);
	console.log(`Images optimized:     ${optimizedResults.length}`);
	console.log(`Images copied:        ${copiedResults.length}`);
	console.log(`Original total size:  ${formatSize(totalOriginal)}`);
	console.log(`Optimized total size: ${formatSize(totalOptimized)}`);
	console.log(`Total reduction:      ${formatSize(totalReduction)} (${reductionPercent}%)`);
	console.log('\nOriginal images stored in:', DIRS.ORIGINAL);
	console.log('Optimized images saved to:', DIRS.OPTIMIZED);
}

async function main() {
	try {
		console.log('Image Optimization Script');
		console.log('========================\n');

		// Setup directories
		setupDirectories();

		// Check available tools
		const tools = getAvailableTools();
		console.log('\nAvailable optimization tools:');
		console.log(`  pngquant: ${tools.pngquant ? '✓' : '✗'}`);
		console.log(`  optipng:  ${tools.optipng ? '✓' : '✗'}`);
		console.log(`  sharp:    ${tools.sharp ? '✓' : '✗'}`);

		if (!tools.pngquant && !tools.optipng && !tools.sharp) {
			console.error('\nNo optimization tools available!');
			console.log('\nPlease install one of the following:');
			console.log('  brew install pngquant');
			console.log('  brew install optipng');
			console.log('  npm install -g sharp-cli');
			process.exit(1);
		}

		// Move existing images to original folder if this is first run
		console.log('\nChecking for existing images...');
		const hasExistingImages = moveExistingImages();

		// Get all images from original directory
		const imageFiles = getImageFiles(DIRS.ORIGINAL);
		if (imageFiles.length === 0) {
			console.log('\nNo image files found in', DIRS.ORIGINAL);
			if (!hasExistingImages) {
				console.log('\nPlease add original images to:', DIRS.ORIGINAL);
			}
			process.exit(0);
		}

		// Filter images that need optimization
		const imagesToOptimize = imageFiles.filter(image => {
			const optimizedPath = path.join(DIRS.OPTIMIZED, image.relativePath);
			return needsOptimization(image.fullPath, optimizedPath);
		});

		if (imagesToOptimize.length === 0) {
			console.log('\nAll images are already optimized and up to date!');
			process.exit(0);
		}

		console.log(`\nFound ${imagesToOptimize.length} images to optimize:`);
		imagesToOptimize.forEach(file => {
			const marker = file.size > SIZE_THRESHOLDS.CRITICAL ? '⚠️ ' :
			               file.size > SIZE_THRESHOLDS.WARNING ? '⚡ ' : '  ';
			console.log(`${marker}${file.relativePath}: ${formatSize(file.size)}`);
		});

		// Optimize images
		const results = [];
		for (const image of imagesToOptimize) {
			const outputPath = path.join(DIRS.OPTIMIZED, image.relativePath);
			const result = optimizeImage(image, outputPath, tools);
			results.push(result);
		}

		// Generate report
		generateReport(results);

	} catch (error) {
		console.error('\nError:', error.message);
		process.exit(1);
	}
}

main();