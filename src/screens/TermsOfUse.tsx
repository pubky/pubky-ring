import React, { memo, useCallback, useState } from 'react';
import { Image, Linking, StyleSheet, TouchableOpacity } from 'react-native';
import {
	View,
	Text,
	ScrollView,
	RadialGradient,
} from '../theme/components.ts';
import LinearGradient from 'react-native-linear-gradient';
import PubkyRingHeader from '../components/PubkyRingHeader.tsx';
import { BLUE_RADIAL_GRADIENT, TERMS_OF_USE } from '../utils/constants.ts';
import { useDispatch, useSelector } from 'react-redux';
import { updateSignedTermsOfUse } from '../store/slices/settingsSlice.ts';
import { getHasPubkys } from '../store/selectors/pubkySelectors.ts';
import { getShowOnboarding } from '../store/selectors/settingsSelectors.ts';
import { useTypedNavigation } from '../navigation/hooks';
import { useTranslation } from 'react-i18next';

const TermsOfUse = (): React.ReactElement => {
	const { t } = useTranslation();
	const navigation = useTypedNavigation();
	const dispatch = useDispatch();
	const _hasPubkys = useSelector(getHasPubkys);
	const showOnboarding = useSelector(getShowOnboarding);

	const [checked, setChecked] = useState(false);
	const [privacyChecked, setPrivacyChecked] = useState(false);

	const canContinue = checked && privacyChecked;

	const onContinue = useCallback(() => {
		if (canContinue) {
			dispatch(updateSignedTermsOfUse({ signedTermsOfUse: true }));
			navigation.replace(showOnboarding ? 'Onboarding' : (_hasPubkys ? 'Home' : 'Onboarding'));
		}
	}, [_hasPubkys, canContinue, dispatch, navigation, showOnboarding]);

	const onPrivacyFormPress = (): void => {
		try {
			Linking.openURL(TERMS_OF_USE).then(() => setPrivacyChecked(!privacyChecked));
		} catch {}
	};


	return (
		<View style={styles.container}>
			<RadialGradient
				style={styles.onboardingGradient}
				colors={BLUE_RADIAL_GRADIENT}
				center={{ x: 1, y: 0.5 }}
			>
				<PubkyRingHeader />
				<Image
					source={require('../images/circle.png')}
					style={styles.backgroundImage}
				/>

				<View style={styles.contentContainer}>
					<ScrollView
						style={styles.scrollView}
						showsVerticalScrollIndicator={false}
					>
						<View style={styles.textContainer}>
							<Text style={styles.title} testID="TermsOfUseTitle">{t('terms.title')}</Text>
							<View style={styles.subtitleContainer}>
								<Text style={[styles.subtitle, styles.subtitleHeading]}>PUBKY RING TERMS OF SERVICE</Text>

								<Text style={[styles.subtitle, styles.dateText]}>Effective Date: March 20, 2025</Text>

								<Text style={[styles.subtitle, styles.importantText]}>
									IMPORTANT: By accessing or using any of the Pubky Ring services (as defined below), you ("you," "your," "User") acknowledge that you have read, understand, and completely agree to these Terms (as updated and amended from time to time, the "Terms"). If you do not agree to be bound by these Terms or with any subsequent amendments, changes, or updates, you may not access or use any of the Pubky Ring services. Your only recourse in case of disagreement is to stop using all Pubky Ring services and delete the application. These Terms apply to all users and others who access the Pubky Ring services ("Users").
								</Text>

								<Text style={styles.subtitle}>
									Only Eligible Users (as defined below) are permitted to access or use Pubky Ring. Any person that is not an Eligible User and utilizes Pubky Ring services will be in breach of these Terms.
								</Text>

								<Text style={[styles.subtitle, styles.importantText]}>
									PUBKY RING IS A TECHNOLOGY PROVIDER ONLY. PUBKY RING DOES NOT PROVIDE CUSTODIAL SERVICES FOR DIGITAL ASSETS OR FUNDS. YOU SHOULD ONLY USE PUBKY RING IF YOU UNDERSTAND DIGITAL ASSETS AND HOW TO CUSTODY THEM. PUBKY RING DOES NOT STORE USERS' PRIVATE KEYS OR RECOVERY PHRASES. IF YOU LOSE SUCH INFORMATION, YOU WILL LOSE ACCESS TO PUBKY RING AND ANY DIGITAL ASSETS YOU HOLD THEREIN. PUBKY RING CANNOT RECOVER ACCESS FOR YOU.
								</Text>

								<Text style={[styles.subtitle, styles.importantText]}>
									PLEASE REVIEW THE ARBITRATION PROVISION SET FORTH BELOW CAREFULLY, AS IT REQUIRES ALL PERSONS TO RESOLVE DISPUTES THROUGH FINAL AND BINDING ARBITRATION AND WAIVE ANY RIGHT TO PARTICIPATE IN CLASS ACTIONS.
								</Text>

								<Text style={[styles.subtitle, styles.sectionTitle]}>1. INTRODUCTION</Text>

								<Text style={styles.subtitle}>
									This section introduces these Terms, how they may be updated, and sets out our legal relationship with you.
								</Text>

								<Text style={styles.subtitle}>
									These Terms, together with the incorporated materials, constitute the entire agreement regarding your access to and use of Pubky Ring services, between you and Synonym Software S.A. de C.V a company incorporated in the Republic of El Salvador.
								</Text>

								<Text style={styles.subtitle}>
									We may amend, change, or update these Terms at any time without prior notice. Your continued access or use of Pubky Ring services after any amendments constitute acceptance of the updated Terms. If you do not agree, your only recourse is to stop using Pubky Ring and delete the application.
								</Text>

								<Text style={styles.subtitle}>
									The use of Pubky Ring is void where prohibited by applicable laws.
								</Text>

								<Text style={[styles.subtitle, styles.sectionTitle]}>2. DEFINITIONS</Text>

								<Text style={styles.subtitle}>
									In these Terms, the following words have the following meanings:
								</Text>

								<View style={styles.bulletContainer}>
									<Text style={[styles.subtitle, styles.bulletMain]}>• "Eligible User" means a User who:</Text>
									<View style={styles.subBulletContainer}>
										<Text style={[styles.subtitle, styles.bulletSub]}>○ Is not a Prohibited Person;</Text>
										<Text style={[styles.subtitle, styles.bulletSub]}>○ Does not use Pubky Ring for Prohibited Uses;</Text>
										<Text style={[styles.subtitle, styles.bulletSub]}>○ Has assured that any recipient of a transaction is not a Prohibited Person.</Text>
									</View>
								</View>

								<View style={styles.bulletContainer}>
									<Text style={[styles.subtitle, styles.bulletMain]}>• "Prohibited Person" means any individual or entity:</Text>
									<View style={styles.subBulletContainer}>
										<Text style={[styles.subtitle, styles.bulletSub]}>○ Subject to international sanctions or restrictions;</Text>
										<Text style={[styles.subtitle, styles.bulletSub]}>○ Located in jurisdictions where Pubky Ring is prohibited by law;</Text>
										<Text style={[styles.subtitle, styles.bulletSub]}>○ Engaged in fraudulent, illicit, or unlawful activities.</Text>
									</View>
								</View>

								<View style={styles.bulletContainer}>
									<Text style={[styles.subtitle, styles.bulletMain]}>• "Prohibited Uses" include, but are not limited to:</Text>
									<View style={styles.subBulletContainer}>
										<Text style={[styles.subtitle, styles.bulletSub]}>○ Using Pubky Ring to facilitate violations of laws, regulations, or sanctions;</Text>
										<Text style={[styles.subtitle, styles.bulletSub]}>○ Any other use that Pubky deems inappropriate.</Text>
									</View>
								</View>

								<Text style={[styles.subtitle, styles.sectionTitle]}>3. PUBKY RING SERVICES</Text>

								<Text style={styles.subtitle}>
									Pubky Ring is a self-sovereign identity and communications platform built on decentralized technologies. Pubky Ring does not provide custodial services for digital assets, nor does it store, hold, or have access to Users' private keys.
								</Text>

								<Text style={styles.subtitle}>Pubky Ring enables Users to:</Text>

								<View style={styles.bulletContainer}>
									<Text style={[styles.subtitle, styles.bulletMain]}>• Create and manage decentralized identities;</Text>
									<Text style={[styles.subtitle, styles.bulletMain]}>• Exchange encrypted messages securely;</Text>
									<Text style={[styles.subtitle, styles.bulletMain]}>• Connect with others via verified cryptographic channels.</Text>
								</View>

								<Text style={styles.subtitle}>
									We do not guarantee uninterrupted access, error-free functionality, or security against all potential risks.
								</Text>

								<Text style={[styles.subtitle, styles.sectionTitle]}>4. PRIVACY AND DATA SECURITY</Text>

								<Text style={styles.subtitle}>
									Pubky Ring does not collect personally identifiable information or store private keys. All user data is encrypted and processed locally on your device.
								</Text>

								<Text style={styles.subtitle}>
									Users are responsible for safeguarding their own data, backup phrases, and private keys. Loss of this information will result in the irreversible loss of access to the account.
								</Text>

								<Text style={[styles.subtitle, styles.sectionTitle]}>5. USER RESPONSIBILITIES</Text>

								<Text style={styles.subtitle}>By using Pubky Ring, you agree to:</Text>

								<View style={styles.bulletContainer}>
									<Text style={[styles.subtitle, styles.bulletMain]}>• Use the service only for lawful purposes;</Text>
									<Text style={[styles.subtitle, styles.bulletMain]}>• Not attempt to interfere with, compromise, or disrupt the platform;</Text>
									<Text style={[styles.subtitle, styles.bulletMain]}>• Maintain security over your private keys and sensitive data;</Text>
									<Text style={[styles.subtitle, styles.bulletMain]}>• Assume full responsibility for all activities conducted through your account.</Text>
								</View>

								<Text style={styles.subtitle}>
									You acknowledge that Pubky Ring is a non-custodial service, and you are solely responsible for any digital assets managed through the platform.
								</Text>

								<Text style={[styles.subtitle, styles.sectionTitle]}>6. LIMITATION OF LIABILITY</Text>

								<Text style={[styles.subtitle, styles.importantText]}>
									TO THE MAXIMUM EXTENT PERMITTED BY LAW, PUBKY RING AND ITS AFFILIATES SHALL NOT BE LIABLE FOR:
								</Text>

								<View style={styles.bulletContainer}>
									<Text style={[styles.subtitle, styles.bulletMain, styles.importantText]}>• ANY INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING FROM THE USE OR INABILITY TO USE PUBKY RING;</Text>
									<Text style={[styles.subtitle, styles.bulletMain, styles.importantText]}>• SECURITY BREACHES, HACKS, OR UNAUTHORIZED ACCESS BEYOND OUR CONTROL.</Text>
								</View>

								<Text style={[styles.subtitle, styles.sectionTitle]}>7. DISPUTE RESOLUTION & ARBITRATION</Text>

								<Text style={styles.subtitle}>
									All disputes arising from or related to these Terms shall be resolved through binding arbitration in the Republic of El Salvador, waiving the right to participate in class action lawsuits.
								</Text>

								<Text style={styles.subtitle}>
									By using Pubky Ring, you expressly acknowledge that you have read and understand this arbitration provision and agree to its terms.
								</Text>

								<Text style={[styles.subtitle, styles.sectionTitle]}>8. TERMINATION</Text>

								<Text style={styles.subtitle}>
									Pubky Ring may, at its sole discretion, suspend or terminate access to its services if you:
								</Text>

								<View style={styles.bulletContainer}>
									<Text style={[styles.subtitle, styles.bulletMain]}>• Violate these Terms;</Text>
									<Text style={[styles.subtitle, styles.bulletMain]}>• Engage in Prohibited Uses;</Text>
									<Text style={[styles.subtitle, styles.bulletMain]}>• Are found to be a Prohibited Person.</Text>
								</View>

								<Text style={styles.subtitle}>
									Termination will result in the loss of access to Pubky Ring and any associated data.
								</Text>

								<Text style={[styles.subtitle, styles.sectionTitle]}>9. GENERAL PROVISIONS</Text>

								<View style={styles.bulletContainer}>
									<Text style={[styles.subtitle, styles.bulletMain]}>• Governing Law: These Terms shall be governed by the laws of the Republic of El Salvador.</Text>
									<Text style={[styles.subtitle, styles.bulletMain]}>• Severability: If any provision of these Terms is found invalid, the remaining provisions will remain in full effect.</Text>
									<Text style={[styles.subtitle, styles.bulletMain]}>• No Waiver: Failure to enforce any right under these Terms shall not constitute a waiver of that right.</Text>
									<Text style={[styles.subtitle, styles.bulletMain]}>• Entire Agreement: These Terms constitute the full agreement between you and Pubky Ring.</Text>
								</View>

								<Text style={[styles.subtitle, styles.sectionTitle]}>10. FEEDBACK</Text>

								<Text style={styles.subtitle}>
									You may choose to, or we may invite you to, submit comments or ideas about the Pubky Ring Services, including without limitation about how to improve the Pubky Ring Services or our products ("Ideas"). By submitting any Idea, you agree that your disclosure is gratuitous, unsolicited, and without restriction and will not place Synonym under any fiduciary or other obligation. Synonym and its Associates are free to use the Idea without any additional compensation to you and/or to disclose the Idea on a non-confidential basis or otherwise to anyone. You grant Synonym and its Associates a worldwide, perpetual, irrevocable, non-exclusive, royalty-free license (with the right to sublicense) to any Intellectual Property Rights you may have in such Idea to use, including to improve the Pubky Ring Services, copy, reproduce, modify, publish, transmit, broadcast, display, and distribute. You further acknowledge that, by accepting your submission, Synonym does not waive any rights to use similar or related ideas previously known to Synonym, developed by its employees, or obtained from sources other than you.
								</Text>

								<Text style={styles.subtitle}>
									For any questions regarding these Terms, contact us at: info@synonym.to
								</Text>

								<Text style={styles.subtitle}>
									By using Pubky Ring, you acknowledge that you understand and agree to these Terms of Service.
								</Text>
							</View>
							{/* Extra padding to ensure scrolling reaches beyond the fade overlay */}
							<View style={styles.extraPadding} />
						</View>
					</ScrollView>

					{/* Fade overlay */}
					<LinearGradient
						style={styles.fadeOverlay}
						colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 1)']}
						start={{ x: 0, y: 0 }}
						end={{ x: 0, y: 1 }}
						pointerEvents="none"
					/>

					{/* Footer */}
					<View style={styles.footer}>
						<View style={styles.checkboxContainer}>
							<Text style={styles.footerHeaderText}>{t('terms.termsOfUse')}</Text>
							<TouchableOpacity
								onPress={() => setChecked(!checked)}
								activeOpacity={0.7}
								style={styles.checkboxRow}
								testID="TermsAgreeRow">
								<Text style={styles.footerText}>
									{t('terms.acceptTerms')}
								</Text>
								<TouchableOpacity
									testID="TermsAgreeCheckbox"
									style={[styles.checkbox, checked && styles.checkboxChecked]}
									onPress={() => setChecked(!checked)}
									activeOpacity={0.7}
								>
									{checked && <View style={styles.checkmark} />}
								</TouchableOpacity>
							</TouchableOpacity>
						</View>

						<View style={styles.checkboxDivider} />

						<View style={styles.checkboxContainer}>
							<Text style={styles.footerHeaderText}>{t('terms.privacyPolicy')}</Text>
							<TouchableOpacity
								onPress={() => setPrivacyChecked(!privacyChecked)}
								activeOpacity={0.7}
								style={styles.checkboxRow}
								testID="PrivacyAgreeRow">
								<Text style={styles.footerText}>
									{t('terms.acceptPrivacy')}
									<Text
										onPress={onPrivacyFormPress}
										style={styles.linkText}>{t('terms.privacyPolicy')}</Text>.
								</Text>
								<TouchableOpacity
									testID="PrivacyAgreeCheckbox"
									style={[styles.checkbox, privacyChecked && styles.checkboxChecked]}
									onPress={() => setPrivacyChecked(!privacyChecked)}
									activeOpacity={0.7}
								>
									{privacyChecked && <View style={styles.checkmark} />}
								</TouchableOpacity>
							</TouchableOpacity>
						</View>

						<TouchableOpacity
							onPress={onContinue}
							disabled={!canContinue}
							style={[styles.continueButton, canContinue ? null : styles.continueButtonInactive ]}
							testID="TermsContinueButton"
						>
							<Text
								style={styles.buttonText}
								numberOfLines={1}
								adjustsFontSizeToFit
								minimumFontScale={0.8}
							>{t('common.continue')}</Text>
						</TouchableOpacity>
					</View>
				</View>
			</RadialGradient>
		</View>
	);
};

const styles = StyleSheet.create({
	continueButtonInactive: {
		opacity: 0.4,
	},
	continueButton: {
		flex: 1,
		backgroundColor: 'rgba(255, 255, 255, 0.10)',
		borderColor: 'white',
		borderWidth: 1,
		borderRadius: 64,
		paddingVertical: 20,
		paddingHorizontal: 24,
		alignItems: 'center',
		minHeight: 64,
		marginTop: 20,
	},
	buttonText: {
		color: 'white',
		fontSize: 15,
		fontWeight: 600,
		lineHeight: 18,
		letterSpacing: 0.2,
		fontFamily: 'InterTight-VariableFont_wght',
	},
	container: {
		flex: 1,
	},
	contentContainer: {
		flex: 1,
		position: 'relative',
		backgroundColor: 'transparent',
	},
	scrollView: {
		flex: 1,
		backgroundColor: 'transparent',
		paddingHorizontal: 16,
	},
	textContainer: {
		paddingBottom: 120, // Extra space for scrolling past the footer
		backgroundColor: 'transparent',
	},
	title: {
		fontSize: 48,
		fontWeight: 700,
		lineHeight: 48,
		textAlign: 'left',
		marginBottom: 16,
	},
	subtitleContainer: {
		marginBottom: 16,
		backgroundColor: 'transparent',
	},
	subtitle: {
		color: 'rgba(255, 255, 255, 0.80)',
		fontSize: 17,
		fontWeight: 400,
		lineHeight: 22,
		letterSpacing: 0.4,
		marginBottom: 16,
	},
	subtitleHeading: {
		fontWeight: 700,
		fontSize: 20,
		marginBottom: 18,
	},
	dateText: {
		fontStyle: 'italic',
		marginBottom: 24,
	},
	importantText: {
		fontWeight: 600,
	},
	sectionTitle: {
		fontWeight: 700,
		fontSize: 18,
		marginTop: 12,
		marginBottom: 12,
	},
	bulletContainer: {
		marginLeft: 8,
		marginBottom: 16,
		backgroundColor: 'transparent',
	},
	bulletMain: {
		marginBottom: 8,
	},
	subBulletContainer: {
		marginLeft: 16,
		backgroundColor: 'transparent',
	},
	bulletSub: {
		marginBottom: 8,
	},
	extraPadding: {
		backgroundColor: 'transparent',
		height: 200, // Space to ensure content can scroll past the fade
	},
	backgroundImage: {
		position: 'absolute',
		top: 0,
		bottom: 0,
		left: 150,
		right: 0,
		width: '100%',
		height: '100%',
		resizeMode: 'cover',
	},
	onboardingGradient: {
		position: 'absolute',
		width: '100%',
		height: '100%',
		resizeMode: 'cover',
	},
	fadeOverlay: {
		position: 'absolute',
		bottom: 230, // Position where fade starts
		left: 0,
		right: 0,
		height: 200, // Height of the fade effect
		zIndex: 1, // Ensure gradient appears above content
	},
	footer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: '#000000',
		paddingHorizontal: 16,
		paddingTop: 5,
		paddingBottom: 40,
		borderTopWidth: 1,
		borderTopColor: 'rgba(255, 255, 255, 0.1)',
		zIndex: 2, // Ensure footer appears above the fade overlay
	},
	footerHeaderText: {
		fontSize: 18,
		fontWeight: 600,
		color: 'white',
		marginBottom: 2,
		opacity: 1,
	},
	footerText: {
		fontSize: 16,
		color: 'rgba(255, 255, 255, 0.8)',
		flex: 0.75,
	},
	linkText: {
		fontSize: 16,
		color: '#3498db',
		textDecorationLine: 'underline',
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		textAlign: 'center',
	},
	checkboxContainer: {
	},
	checkboxRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	checkboxDivider: {
		marginVertical: 10,
		height: 1,
		width: '100%',
		backgroundColor: '#272727',
	},
	checkbox: {
		width: 34,
		height: 34,
		borderRadius: 6,
		borderWidth: 2,
		borderColor: '#5F5F5F',
		backgroundColor: 'rgba(255, 255, 255, 0.10)',
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 10,
	},
	checkboxChecked: {
		backgroundColor: 'rgba(255, 255, 255, 0.10)',
	},
	checkmark: {
		width: 14,
		height: 8,
		borderLeftWidth: 2,
		borderBottomWidth: 2,
		borderColor: 'white',
		transform: [{ rotate: '-45deg' }],
		top: -2,
	},
});

export default memo(TermsOfUse);
