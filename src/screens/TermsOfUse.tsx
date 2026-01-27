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
								<Text style={[styles.subtitle, styles.subtitleHeading]}>PUBKY RING TERMS AND CONDITIONS</Text>

								<Text style={[styles.subtitle, styles.dateText]}>Effective Date: January 2026</Text>

								<Text style={styles.subtitle}>
									Thank you for using the Pubky platform and the products, services and features we make available to you as part of the platform, including Pubky Ring ("Pubky Ring"). The terms and conditions set forth below (as updated and amended from time to time, and collectively with the Privacy Policy and any other materials explicitly incorporated by us, these "Terms") govern your access to and use of the Pubky Ring.
								</Text>

								<Text style={[styles.subtitle, styles.importantText]}>
									PLEASE REVIEW THE ARBITRATION PROVISION SET FORTH BELOW CAREFULLY, AS IT WILL REQUIRE ALL PERSONS TO RESOLVE DISPUTES ON AN INDIVIDUAL BASIS THROUGH FINAL AND BINDING ARBITRATION AND TO WAIVE ANY RIGHT TO PROCEED AS A REPRESENTATIVE OR CLASS MEMBER IN ANY CLASS OR REPRESENTATIVE PROCEEDING. BY USING PUBKY RING, YOU EXPRESSLY ACKNOWLEDGE THAT YOU HAVE READ AND UNDERSTAND ALL OF THE TERMS OF THIS PROVISION AND HAVE TAKEN TIME TO CONSIDER THE CONSEQUENCES OF THIS IMPORTANT DECISION.
								</Text>

								<Text style={[styles.subtitle, styles.importantText]}>
									THESE TERMS FORM A LEGALLY BINDING AGREEMENT BETWEEN YOU AND SYNONYM (AS DEFINED BELOW). BY ACCESSING, DOWNLOADING OR USING PUBKY RING, YOU CONFIRM THAT YOU ACCEPT THESE TERMS AND AGREE TO COMPLY WITH THEM. IF YOU DO NOT AGREE TO BE BOUND BY THESE TERMS OR OTHER REFERENCED DOCUMENTATION, YOU MUST CEASE TO ACCESS OR USE PUBKY RING. IF YOU ARE USING PUBKY RING ON BEHALF OF ANOTHER PERSON OR ENTITY, YOU REPRESENT THAT YOU HAVE THE AUTHORITY TO ACT ON BEHALF OF SUCH PERSON OR ENTITY, AND THAT SUCH PERSON OR ENTITY ACCEPTS THESE TERMS.
								</Text>

								<Text style={[styles.subtitle, styles.sectionTitle]}>What's in these Terms?</Text>

								<Text style={styles.subtitle}>
									These Terms tell you the rules for using Pubky Ring. We recommend printing a copy of these Terms for future reference. In the event of any conflict or inconsistency between these Terms and any other pages, policies, terms, conditions, licenses, limitations, or obligations contained referenced in these Terms, or any other agreements between you and us or third parties, these Terms shall prevail as they relate to your use of, or access to, Pubky Ring.
								</Text>

								<Text style={[styles.subtitle, styles.sectionTitle]}>1. Who we are and how to contact us</Text>

								<Text style={styles.subtitle}>
									Pubky Ring is operated by Synonym Software Ltd. ("we", "us", "our", and "Synonym"), a company operating under the laws of the Republic of El Salvador, located at 87 Avenida Norte, Calle El Mirador, Edificio Torre Futura, Oficina 06, Nivel 11, Colonia Escalón, Del Municipio de San Salvador, Departamento de San Salvador, Código Postal 01101, República de El Salvador. To contact us, please email info@synonym.to.
								</Text>

								<Text style={[styles.subtitle, styles.sectionTitle]}>2. What we do</Text>

								<Text style={styles.subtitle}>
									We have developed and released the software application known as 'Pubky Ring', a password manager and digital wallet designed to simplify and secure online experiences for both individuals and businesses. Pubky Ring enables users to securely store essential micro-data, such as website logins, and to verify their identities when accessing third-party applications, websites, or services. Pubky Ring was originally developed by us and is available for use subject to these Terms.
								</Text>

								<Text style={[styles.subtitle, styles.sectionTitle]}>3. System requirements</Text>

								<Text style={styles.subtitle}>
									Use of Pubky Ring requires a compatible device and internet access (third party fees may apply), and may require obtaining updates or upgrades from time-to-time. Synonym does not warrant that Pubky Ring will be compatible with your device. You acknowledge that Synonym may from time-to-time issue upgraded versions of Pubky Ring and may automatically electronically upgrade the version of Pubky Ring that you are using. You consent to such automatic upgrading on your device and agree that these Terms will apply to all such upgrades. Because use of Pubky Ring involves hardware, software, and internet access, your ability to access and use Pubky Ring may be affected by the performance of these factors. High-speed internet access is recommended. You acknowledge and agree that such system requirements, which may change from time to time, are your sole responsibility.
								</Text>

								<Text style={[styles.subtitle, styles.sectionTitle]}>4. Using Pubky Ring</Text>

								<Text style={[styles.subtitle, styles.importantText]}>How you may use Pubky Ring</Text>

								<Text style={styles.subtitle}>
									We or our licensors own all right, title and interest, including intellectual property rights in and to Pubky Ring. We grant you a personal, non-assignable license to use Pubky Ring for your own internal use. All rights not otherwise granted under these Terms are reserved. You must not sub-license, sell, rent, lend, lease or distribute Pubky Ring, or otherwise make Pubky Ring available to any third parties for commercial purposes, including as part of a commercial product or service, without obtaining a licence to do so from us or our licensors. Synonym may terminate this license at any time for any reason.
								</Text>

								<Text style={[styles.subtitle, styles.importantText]}>How does Pubky Ring work?</Text>

								<Text style={styles.subtitle}>
									The Pubky Ring application allows you to securely store cryptographic keys on your own device and use those keys to authenticate into third-party applications or websites. Pubky Ring does not have access to your keys, does not store your keys or recovery information, and cannot assist in recovering access if you lose this information. The application does not provide any custodial services, does not collect or transmit your data, and does not interact with any online platform or website operated by Pubky Ring. All authentication and key management activities are performed locally on your device.
								</Text>

								<Text style={[styles.subtitle, styles.importantText]}>Use Restrictions</Text>

								<Text style={styles.subtitle}>
									Pubky Ring is intended solely for proper use of managing and using cryptographic keys for authentication. Under no circumstances should you attempt to use your Pubky Ring to store, transmit, or manage any data or assets other than cryptographic keys for authentication purposes. Synonym assumes no responsibility in connection with your failure to use the application as intended. Synonym assumes no responsibility in connection with your use of the application for unsupported services or systems.
								</Text>

								<Text style={styles.subtitle}>
									Only Eligible Users as described below are permitted to access or use Pubky Ring. Any person that is not an Eligible User that utilises the Platform will be in breach of these Terms and may have their Pubky account closed immediately. Users of Pubky Ring shall be "Eligible Users" where they comply with the "User Identity Requirements" listed below and they do not utilise Pubky Ring to facilitate any Prohibited Uses as described below. The access or use of Pubky Ring by any person other than an Eligible User is void and shall not be the basis for the assertion or recognition of any interest, right, remedy, power, or privilege.
								</Text>

								<Text style={styles.subtitle}>
									You must access and use Pubky Ring only in compliance with all applicable laws, regulations and third-party rights and in accordance with these Terms. You agree to, and will not attempt to circumvent, such limitations. Without limiting the foregoing, you will not use Pubky Ring (each, "Prohibited Conduct"):
								</Text>

								<View style={styles.bulletContainer}>
									<Text style={[styles.subtitle, styles.bulletMain]}>• to disguise the origin or nature of illicit proceeds or to transact or deal in, any contraband assets, funds, property, or proceeds;</Text>
									<Text style={[styles.subtitle, styles.bulletMain]}>• to transact with anything other than funds, keys, property and assets that have been legally obtained by you and belong to you;</Text>
									<Text style={[styles.subtitle, styles.bulletMain]}>• to evade taxes;</Text>
									<Text style={[styles.subtitle, styles.bulletMain]}>• in a manner that infringes on our or any third party's intellectual property rights;</Text>
									<Text style={[styles.subtitle, styles.bulletMain]}>• to engage in activity that is illegal or fraudulent;</Text>
									<Text style={[styles.subtitle, styles.bulletMain]}>• to copy any features, functions or graphics of Pubky Ring;</Text>
									<Text style={[styles.subtitle, styles.bulletMain]}>• provide any software, content or code that does or is intended to harm or extract information or data from Pubky Ring or other hardware or software;</Text>
									<Text style={[styles.subtitle, styles.bulletMain]}>• to use Pubky Ring in violation of any of our policies or in a manner that violates applicable law, including but not limited to sanctions, anti-money laundering, export control, privacy, and anti-terrorism laws, and you agree that you are solely responsible for compliance with all such laws and regulations; or</Text>
									<Text style={[styles.subtitle, styles.bulletMain]}>• in a manner that otherwise violates, or encourages or promotes the violation of, any applicable law or third party right.</Text>
								</View>

								<Text style={styles.subtitle}>
									We have no tolerance for Prohibited Conduct or users who abuse the use of Pubky Ring in contravention of these Terms.
								</Text>

								<Text style={styles.subtitle}>
									If Synonym determines or suspects that you have engaged in any Prohibited Conduct, Synonym may address such Prohibited Conduct through an appropriate sanction, in its sole and absolute discretion. Such sanction may include: (i) making a report to any government, law enforcement, or other authorities, without providing any notice to you about any such report; or (ii) suspending or terminating your access to Pubky Ring. In addition, should your actions or inaction result in any loss being suffered by Synonym or any of its affiliates, you shall pay an amount to Synonym or the affiliate, as applicable, so as to render Synonym or the affiliate whole, including the amount of taxes or penalties that might be imposed on Synonym or the affiliate, as applicable.
								</Text>

								<Text style={[styles.subtitle, styles.importantText]}>No Representations and Warranties</Text>

								<Text style={styles.subtitle}>
									We make no representations, warranties, covenants or guarantees to you of any kind and, to the extent permitted by applicable laws, we expressly disclaim all representations, warranties, covenants or guarantees, express, implied or statutory, with respect to Pubky Ring. Pubky Ring is offered strictly on an "as is" and "as available" basis and, without limiting the generality of the foregoing, is provided without any representation as to merchantability, merchantable quality, or fitness for any particular purpose or any representation or warranty that Pubky Ring will be operational, error-free, secure, confidential, reliable, or safe, that Pubky Ring will function without disruptions, delays or imperfections. We do not guarantee the security or functionality of any third-party software or technology. You acknowledge that we are relying upon your representations, warranties, acknowledgements, and agreements as a condition to providing Pubky Ring, and without your representations, warranties, acknowledgements, and agreements, we would not provide you with Pubky Ring.
								</Text>

								<Text style={[styles.subtitle, styles.importantText]}>Security Responsibility</Text>

								<Text style={styles.subtitle}>
									You are responsible for keeping your Pubky Ring access secure. We offer tools such as two-factor authentication to help you maintain security, but the content and protection of your personal information are ultimately your responsibility. You are responsible for all activity that occurs under your Pubky Ring access and are responsible for maintaining the security of your login credentials. Synonym cannot and will not be liable for any loss or damage from your failure to comply with this security obligation. You will promptly notify Synonym if you become aware of any unauthorized use of, or access to, your Pubky Ring access, including any unauthorized use of your password or other login credentials.
								</Text>

								<Text style={[styles.subtitle, styles.sectionTitle]}>5. We may make changes to these Terms</Text>

								<Text style={styles.subtitle}>
									We may amend these Terms from time to time. When we do this, we will post the revised Terms on this page and indicate the date of such amendments. You should check these Terms periodically. Your continued used of Pubky Ring will constitute your agreement to the revised Terms.
								</Text>

								<Text style={[styles.subtitle, styles.sectionTitle]}>6. We may make changes to Pubky Ring, including based on your feedback</Text>

								<Text style={styles.subtitle}>
									We may update and change Pubky Ring, or any feature or functionality thereof, from time to time and without notice to you.
								</Text>

								<Text style={styles.subtitle}>
									If you provide feedback or suggestions about Pubky Ring, then we may act on that feedback or those suggestions on an unrestricted basis and without any obligations to you (including any obligation to compensate you or to keep that feedback confidential).
								</Text>

								<Text style={[styles.subtitle, styles.sectionTitle]}>7. We may suspend or withdraw Pubky Ring</Text>

								<Text style={styles.subtitle}>
									We do not guarantee that Pubky Ring will always be available or uninterrupted. We may suspend, withdraw, or restrict the availability of all or any part of Pubky Ring for business and operational reasons. We will try to give reasonable notice of any suspension or withdrawal of Pubky Ring by notice on this page.
								</Text>

								<Text style={[styles.subtitle, styles.sectionTitle]}>8. We may transfer these Terms to someone else</Text>

								<Text style={styles.subtitle}>
									These Terms, and any of the rights, duties, and obligations contained or incorporated herein, are not transferable by you without our prior written consent, and any attempt by you to transfer these Terms without such consent will be void.
								</Text>

								<Text style={styles.subtitle}>
									These Terms, and any of the rights, duties, and obligations contained or incorporated herein, are freely assignable by Synonym, in whole or in part, without notice or your consent (for clarity, this assignment right includes the right for Synonym to assign any claim, in whole or in part, arising hereunder).
								</Text>

								<Text style={styles.subtitle}>
									Subject to the foregoing, these Terms, and any of the rights, duties, and obligations contained or incorporated herein, shall be binding upon and inure to the benefit of the successors and assigns of you and of Synonym. None of the provisions of these Terms, or any of the rights, duties, and obligations contained or incorporated herein, are for the benefit of or enforceable by any creditors of you or Synonym or any other persons, except: (i) such as inure to a successor or assign in accordance herewith; and (ii) that the employees, contractors, directors, officers, agents, affiliates and suppliers (together, the "Associates") of Synonym are intended third party beneficiaries of the rights and privileges expressly stated to apply to the Associates hereunder and shall be entitled to enforce such rights and privileges as if a direct party to these Terms. No consent of any person or party is required for any modification or amendment to these Terms.
								</Text>

								<Text style={[styles.subtitle, styles.sectionTitle]}>9. Pubky Ring is not for certain users</Text>

								<Text style={styles.subtitle}>You acknowledge and agree that in order to use Pubky Ring:</Text>

								<View style={styles.bulletContainer}>
									<Text style={[styles.subtitle, styles.bulletMain]}>• you must be at least eighteen (18) years of age;</Text>
									<Text style={[styles.subtitle, styles.bulletMain]}>• we must not have previously disabled your access to Pubky Ring for violation of law or because you engaged in Prohibited Conduct as referenced herein;</Text>
									<Text style={[styles.subtitle, styles.bulletMain]}>• you must not be a convicted sex offender;</Text>
									<Text style={[styles.subtitle, styles.bulletMain]}>• if you are under eighteen (18) years old, you represent that you have your parent or legal guardian's permission to use Pubky Ring and will have your parent or legal guardian read these Terms with you; provided, that if you are a parent or legal guardian of a user under the age of eighteen (18), by allowing your child to use Pubky Ring, you are subject to these Terms and responsible for your child's activity on Pubky Ring; and</Text>
									<Text style={[styles.subtitle, styles.bulletMain]}>• if you are using Pubky Ring on behalf of a company or organization, you represent that you have authority to act on behalf of that company or organization, and that such entity accepts these Terms.</Text>
								</View>

								<Text style={[styles.subtitle, styles.sectionTitle]}>10. Our responsibility for loss or damage suffered by you</Text>

								<Text style={styles.subtitle}>
									We do not exclude or limit our liability to you where it would be unlawful to do so. This includes liability for death or personal injury caused by our negligence or the negligence of our employees, agents or subcontractors and for fraud or fraudulent misrepresentation. In addition, some jurisdictions do not allow us to exclude or limit our liability as described in this section. If you are located in one of these jurisdictions, this section may not apply to you, and you may have additional rights.
								</Text>

								<Text style={[styles.subtitle, styles.importantText]}>
									To the fullest extent permitted by applicable law, in no event will our liability to you for any loss or damage, whether in contract, tort (including negligence), breach of statutory duty, or otherwise, even if foreseeable, arising under or in connection with these Terms or your use of, or inability to use, Pubky Ring, exceed US$100.
								</Text>

								<Text style={styles.subtitle}>
									To the fullest extent permitted by applicable law, we will not be liable to you for the following, whether in contract, tort (including negligence), breach of statutory duty, or otherwise, even if foreseeable:
								</Text>

								<View style={styles.bulletContainer}>
									<Text style={[styles.subtitle, styles.bulletMain]}>• loss of profits, sales, business, or revenue;</Text>
									<Text style={[styles.subtitle, styles.bulletMain]}>• business interruption;</Text>
									<Text style={[styles.subtitle, styles.bulletMain]}>• loss of anticipated savings;</Text>
									<Text style={[styles.subtitle, styles.bulletMain]}>• loss of business opportunity, goodwill or reputation; or</Text>
									<Text style={[styles.subtitle, styles.bulletMain]}>• any indirect or consequential loss or damage.</Text>
								</View>

								<Text style={[styles.subtitle, styles.importantText]}>
									THERE IS NO GUARANTEE AGAINST LOSSES FROM USING PUBKY RING.
								</Text>

								<Text style={[styles.subtitle, styles.sectionTitle]}>11. We are not responsible for viruses</Text>

								<Text style={styles.subtitle}>
									We do not guarantee that Pubky Ring will be secure or free from bugs, viruses or other harmful components. You are responsible for configuring your information technology, computer programmes and platform to access and utilise Pubky Ring. You should use your own antivirus and anti-malware protection software.
								</Text>

								<Text style={[styles.subtitle, styles.sectionTitle]}>12. External links</Text>

								<Text style={styles.subtitle}>
									You use Pubky Ring to access certain assets, products and services, including those provided by third parties or decentralized applications, including through default settings, integrations, connections or features made available by Synonym (collectively, "Third-Party Services"). Your use of Third-Party Services is entirely at your own risk and Synonym makes no representations, warranties or guarantees about, accepts no liability for and is not able to control, any Third-Party Services, including as to the privacy, security, or other practices relating to any Third-Party Services.
								</Text>

								<Text style={styles.subtitle}>
									In addition to these Terms, your use of Third-Party Services may be subject to additional terms, conditions and policies required by the providers of such Third-Party Services. Synonym and its affiliates (x) owe you no duty of care with respect to such Third-Party Services and undertake no responsibility, (y) may have certain actual or potential conflicts of interest related to the decision to support or not support a Third-Party Service, and (z) are not responsible for the accuracy or reliability of any information contained in Third-Party Services or its assets, products or services. Further, Synonym and its affiliates may be counterparties to any transaction through Third-Party Services without your knowledge.
								</Text>

								<Text style={[styles.subtitle, styles.sectionTitle]}>13. Injunctive relief</Text>

								<Text style={styles.subtitle}>
									You acknowledge that any use of Pubky Ring contrary to these Terms, or any unpermitted transfer, sublicensing, copying or disclosing of technical information or materials related to Pubky Ring, may cause irreparable injury to us or our affiliates. Under such circumstances, we or our affiliates will be entitled to equitable relief without posting a bond or other security, including, but not limited to, preliminary and permanent injunctive relief.
								</Text>

								<Text style={[styles.subtitle, styles.sectionTitle]}>14. Indemnity</Text>

								<Text style={styles.subtitle}>
									You agree that you will compensate Synonym or any of its Associates in full for any actions, damages, losses, costs and expenses, including reasonable legal fees, which may be imposed on, incurred by, or asserted against, us or our affiliates in any manner relating to or arising out of any breach by you of these Terms, in violation of applicable law, or for any stolen, lost, or unauthorized use of any account credentials, data or other information.
								</Text>

								<Text style={styles.subtitle}>
									To the maximum extent permitted by applicable law, the foregoing indemnity shall apply whether the alleged liability or losses are based on contract, negligence, tort, unjust enrichment, strict liability, violation of law or regulation, or any other basis, even if Synonym or any of its Associates have been advised of or should have known of the possibility of such losses and damages, and without regard to the success or effectiveness of any other remedies.
								</Text>

								<Text style={[styles.subtitle, styles.sectionTitle]}>15. Cancellation and Termination</Text>

								<Text style={styles.subtitle}>
									It is your responsibility to properly cancel your Pubky Ring access with Synonym. Information relating to your Pubky Ring access cannot be recovered once such access is terminated.
								</Text>

								<Text style={styles.subtitle}>
									We reserve the right, in our sole discretion, to suspend and/or terminate your access to Pubky Ring for any reason, including if we determine that you (i) repeatedly submitted manifestly unfounded notices or complaints, or (ii) otherwise violated these Terms or applicable law. This includes our ability to terminate your use of Pubky Ring. In general, we will notify you at the latest from the date the action is taken and provide you with an opportunity to remedy the relevant breach or breaches. However, advanced notification and/or opportunity to remedy will not be provided if the seriousness of the breach requires immediate termination of your access to Pubky Ring, or when it is impossible to remedy the breach.
								</Text>

								<Text style={styles.subtitle}>
									Where we disable or delete your account, we will also provide information about this action and, where required under applicable data protection law, the reasons for it. Where the decision is based solely on automated processing and produces legal or similarly significant effects, you have the right to request human intervention, to express your point of view, and to contest the decision. We may limit or withhold specific information where providing it would adversely affect the rights and freedoms of others, compromise the security or integrity of our services, or where we are legally required to do so.
								</Text>

								<Text style={styles.subtitle}>
									You acknowledge and agree that we shall not be liable to you or any third-party for any termination or suspension of your access to the Platform.
								</Text>

								<Text style={styles.subtitle}>
									All provisions of these Terms which by their nature should survive termination will survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
								</Text>

								<Text style={[styles.subtitle, styles.sectionTitle]}>16. Regional Availability</Text>

								<Text style={styles.subtitle}>
									This section explains geographic restrictions on Pubky Ring features.
								</Text>

								<Text style={styles.subtitle}>
									Certain features and verification methods may not be available in all jurisdictions due to legal, regulatory, or operational requirements. We reserve the right to restrict access to specific features based on your location.
								</Text>

								<Text style={styles.subtitle}>
									The Platform is not available to users in Prohibited Jurisdictions. "Prohibited Jurisdiction" means any of: Cuba, Democratic People's Republic of Korea (North Korea), Iran, Syria, Crimea (a region of Ukraine annexed by the Russian Federation), the self-proclaimed Donetsk People's Republic (a region of Ukraine) and the self-proclaimed Luhansk People's Republic (a region of Ukraine).
								</Text>

								<Text style={[styles.subtitle, styles.sectionTitle]}>17. General (including Mandatory Arbitration)</Text>

								<Text style={[styles.subtitle, styles.importantText]}>Entire agreement:</Text>
								<Text style={styles.subtitle}>
									These Terms constitute the entire agreement between you and Synonym and supersede any prior agreements between you and Synonym. You may also be subject to additional terms of service that may apply when you use affiliate or third-party services, third-party content or third-party software.
								</Text>

								<Text style={[styles.subtitle, styles.importantText]}>Governing Law:</Text>
								<Text style={styles.subtitle}>
									These Terms shall be governed by and construed and enforced in accordance with the laws of England and Wales. Any transaction, dispute, controversy, claim or action arising from or related to your access or use of Pubky Ring or these Terms shall be governed by the laws of England and Wales, exclusive of choice-of-law principles.
								</Text>

								<Text style={[styles.subtitle, styles.importantText]}>Force Majeure:</Text>
								<Text style={styles.subtitle}>
									We are not responsible for damages caused by delay or failure to perform undertakings under these Terms when the delay or failure is due to fires; strikes; floods; power outages or failures; acts of God or the state's enemies; disease pandemics; acts of any government or government official; computer, server, protocol or internet malfunctions; internet disruptions, viruses, and mechanical power, or communication failures; security breaches or cyberattacks; criminal acts; delays or defaults caused by common carriers; acts or omissions of other persons; or, any other delays, defaults, failures or interruptions that cannot reasonably be foreseen or provided against by us or that are otherwise outside of our control ("Force Majeure Events"). We are excused from any and all performance obligations under these Force Majeure Events.
								</Text>

								<Text style={[styles.subtitle, styles.importantText]}>Mandatory Arbitration:</Text>

								<Text style={styles.subtitle}>
									Some jurisdictions do not allow mandatory arbitration, prohibitions against class actions or governing law and forums other than where the individual consumer is located. If you are resident in one of these jurisdictions, this paragraph may not apply to you and you may have additional rights.
								</Text>

								<Text style={styles.subtitle}>
									Except for excluded claims described in the paragraph below, Synonym and you each agree that any dispute, claim or controversy arising out of or relating to (i) these Terms or the existence, breach, termination, enforcement, interpretation or validity thereof, (ii) Pubky Ring or (iii) your use of Pubky Ring at any time, will be subject to and finally resolved by confidential, binding arbitration on an individual basis and not in a class, representative or consolidated action or proceeding. If you are a person subject to the jurisdiction of the United States of America, the interpretation and enforceability of this arbitration provision will be governed by the Federal Arbitration Act, 9 U.S.C. §§ 1 et seq. Arbitration will be conducted through the use of videoconferencing technology (unless both parties agree that an in-person hearing is appropriate given the nature of the dispute) before a single arbitrator in accordance with the LCIA Arbitration Rules 2020 ("LCIA RULES"). The sole arbitrator must be a legal practitioner in London, England with at least fifteen (15) years of experience in commercial disputes, that holds a current practising certificate. If an arbitrator cannot be jointly appointed by the arbitration parties within thirty (30) days of the commencement of the arbitration, an arbitrator meeting the above qualifications will be selected under the Arbitration Rules of the London Court of International Arbitration ("LCIA"). Judgement upon the award rendered by the arbitrator may be entered by any court having jurisdiction thereof. If the arbitral parties do not promptly agree on the seat of arbitration if an in-person hearing is selected, the seat will be London, England. The language of the arbitral proceedings will be English. No discovery shall be conducted except by agreement of the parties or after approval by the arbitrator, who shall attempt to minimize the burden of discovery. The arbitrator may award any relief that a court of competent jurisdiction could award, including attorneys' fees when authorized by laws, and the arbitral decision may be enforced in court. For claims less than U.S.$15,000, Synonym will reimburse you for all initiating filing fees in the event that the claim is successful. The prevailing party, as determined by the arbitrator, will be entitled to its costs of the arbitration (including the arbitrator's fees) and its reasonable attorney's fees and costs.
								</Text>

								<Text style={styles.subtitle}>
									The following claims and causes of action will be excluded from arbitration as described in the paragraph above: causes of action or claims in which either party seeks injunctive or other equitable relief for the alleged unlawful use of its intellectual property or its confidential information or private data. Nothing in this paragraph will prevent us from seeking any other form of injunctive relief in any court of competent jurisdiction, whether or not interim relief has also been sought from the arbitrator.
								</Text>

								<Text style={styles.subtitle}>
									The arbitrator will have the power to hear and determine challenges to its jurisdiction, including any objections with respect to the formation, existence, scope, enforceability or validity of the arbitration agreement. This authority extends to jurisdictional challenges with respect to both the subject matter of the dispute and the parties to the arbitration. Further, the arbitrator will have the power to determine the existence, validity, or scope of the contract of which an arbitration clause forms a part. For the purposes of challenges to the jurisdiction of the arbitrator, each clause in this section will be considered as separable from any contract of which it forms a part. Any challenges to the jurisdiction of the arbitrator, except challenges based on the award itself, will be made not later than the notice of defense or, with respect to a counterclaim, the reply to the counterclaim; provided, however, that if a claim or counterclaim is later added or amended such a challenge may be made not later than the response to such claim or counterclaim as provided under LCIA Rules.
								</Text>

								<Text style={styles.subtitle}>
									You and we expressly intend and agree that: (i) class action and representative action procedures are hereby waived and will not be asserted, nor will they apply, in any arbitration pursuant to these Terms; (ii) neither you nor Synonym will assert class action or representative action claims against the other in arbitration or otherwise; (iii) each of you and Synonym will only submit their own, individual claims in arbitration and will not seek to represent the interests of any other person, or consolidate claims with any other person; (iv) nothing in these Terms will be interpreted as your or Synonym' intent to arbitrate claims on a class or representative basis; and (v) any relief awarded to any one user cannot and may not affect any other user. No adjudicator may consolidate or join more than one person's or party's claims and may not otherwise preside over any form of a consolidated, representative, or class proceeding.
								</Text>

								<Text style={styles.subtitle}>
									You, we and any other arbitration parties will maintain the confidential nature of the arbitration proceeding and any award, including the hearing, except as may be necessary to prepare for or conduct the arbitration hearing on the merits, or except as may be necessary in connection with a court application for a preliminary remedy, a judicial challenge to an award or its enforcement, or unless otherwise required by law or judicial decision.
								</Text>

								<Text style={[styles.subtitle, styles.importantText]}>
									JURY TRIAL WAIVER: TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, THE PARTIES HEREBY IRREVOCABLY AND UNCONDITIONALLY WAIVE ALL RIGHT TO TRIAL BY JURY IN ANY LEGAL ACTION OR PROCEEDING OF ANY KIND WHATSOEVER ARISING OUT OF OR RELATING TO THESE TERMS OR ANY BREACH THEREOF, ANY USE OR ATTEMPTED USE OF PUBKY RING BY YOU, AND/OR ANY OTHER MATTER INVOLVING YOU AND SYNONYM.
								</Text>

								<Text style={[styles.subtitle, styles.importantText]}>Severability:</Text>
								<Text style={styles.subtitle}>
									If any provision of these Terms or part thereof, as amended from time to time, is determined to be invalid, void, or unenforceable, in whole or in part, by any court of competent jurisdiction, such invalidity, voidness, or unenforceability attaches only to such provision to the extent of its illegality, unenforceability, invalidity, or voidness, as may be, and everything else in these Terms continues in full force and effect.
								</Text>

								<Text style={[styles.subtitle, styles.importantText]}>Waiver; Available Remedies:</Text>
								<Text style={styles.subtitle}>
									Any failure by Synonym to exercise any of its rights, powers, or remedies under these Terms, or any delay by Synonym in doing so, does not constitute a waiver of any such right, power, or remedy. The single or partial exercise of any right, power, or remedy by Synonym does not prevent either from exercising any other rights, powers, or remedies. The remedies of Synonym are cumulative with and not exclusive of any other remedy conferred by the provisions of these Terms, or by law or equity. You agree that the remedies to which Synonym is entitled include (i) injunctions to prevent breaches of these Terms and to enforce specifically the terms and provisions hereof, and you waive the requirement of any posting of a bond in connection with such remedies, (ii) the right to recover the amount of any losses by set off against any amounts that Synonym would otherwise be obligated to pay to you, and (iii) the right to seize and recover against any of your assets, or your interests therein, that are held by Synonym or any of its Associates.
								</Text>

								<Text style={[styles.subtitle, styles.importantText]}>Electronic Communications; Acceptance:</Text>
								<Text style={styles.subtitle}>
									You agree and consent to receive electronically all communications, agreements, documents, receipts, notices and disclosures that Synonym may provide in connection with these Terms through publication on any part of Pubky Ring or to an e-mail address on file that you have previously provided to Synonym. Such notices shall be deemed effective and received by you on the date on which the notice is published on any part of Pubky Ring or on which the e-mail is sent to such e-mail address. These Terms may be accepted electronically, and it is the intention of the parties that such acceptance shall be deemed to be as valid as an original signature being applied to these Terms.
								</Text>

								<Text style={[styles.subtitle, styles.sectionTitle]}>18. Our trademarks</Text>

								<Text style={styles.subtitle}>
									'Pubky' and 'Pubky Ring' are trademarks of Synonym Software Ltd. You are not permitted to use them without approval.
								</Text>

								<Text style={styles.subtitle}>
									For any questions regarding these Terms, contact us at: info@synonym.to
								</Text>

								<Text style={styles.subtitle}>
									By using Pubky Ring, you acknowledge that you understand and agree to these Terms and Conditions.
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
