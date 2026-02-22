import { useEffect, useState } from "react";
import {
	AddKeywordModal,
	AddSourcesCompetitor,
	AddSourcesModal,
	TextModal,
} from "./SourceModals";
import { IoClose, IoLibrary, IoBusinessOutline } from "react-icons/io5";
import { MdOutlineTag } from "react-icons/md";

export default function SourceButton({
	isOpen,
	onClose,
	handleFileUpload,
	showAdd,
	setShowAdd,
	setShowLink,
	setShowText,
	showText,
	projectId,
	componentId,
	domainId,
	handleAddSource,
}) {
	const [hoveredButton, setHoveredButton] = useState(null);
	// Handle escape key
	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		if (isOpen) {
			document.body.style.overflow = "hidden";
			window.addEventListener("keydown", handleKeyDown);
		} else {
			document.body.style.overflow = "auto";
		}

		return () => {
			document.body.style.overflow = "auto";
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, onClose]);

	const [showKeyword, setShowKeyword] = useState(false);
	const [showSourceCompetitor, setSourceCompetitor] = useState(false);

	const handleAddKeyword = () => {
		setShowKeyword(true);
	};

	const handleOtherSource = () => {
		setShowAdd(true);
	};

	const handleCompetitor = () => {
		setSourceCompetitor(true);
	};

	const buttonOptions = [
		{
			id: "keyword",
			label: "Add Keyword",
			icon: MdOutlineTag,
			gradient: "from-purple-600 to-purple-700",
			hoverGradient: "hover:from-purple-700 hover:to-purple-800",
			shadowColor: "hover:shadow-purple-500/30",
			onClick: handleAddKeyword,
			description: "Track specific keywords and phrases",
		},
		{
			id: "other",
			label: "Other Source",
			icon: IoLibrary,
			gradient: "from-indigo-600 to-purple-600",
			hoverGradient: "hover:from-indigo-700 hover:to-purple-700",
			shadowColor: "hover:shadow-indigo-500/30",
			onClick: handleOtherSource,
			description: "Add custom data sources",
		},
		{
			id: "competitor",
			label: "Competitor",
			icon: IoBusinessOutline,
			gradient: "from-purple-600 to-pink-600",
			hoverGradient: "hover:from-purple-700 hover:to-pink-700",
			shadowColor: "hover:shadow-purple-500/30",
			onClick: handleCompetitor,
			description: "Monitor competitor activities",
		},
	];

	if (!isOpen) return null;

	return (
		<>
			<div
				className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 "
				onClick={onClose}
			>
				<div
					className="bg-white/95 backdrop-blur-xl rounded-3xl w-full max-w-lg mx-4 shadow-2xl border border-white/20 transform transition-all duration-300 ease-out scale-100 animate-in fade-in-0 zoom-in-95"
					onClick={(e) => e.stopPropagation()}
				>
					{/* Modal Header */}
					<div className="flex items-center justify-between p-8 pb-4">
						<div>
							<h2 className="text-2xl font-bold text-gray-900 mb-2">
								Select a Source Type
							</h2>
							<p className="text-sm text-gray-600 font-medium">
								Choose how you'd like to add your source
							</p>
						</div>
						<button
							onClick={onClose}
							className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 rounded-full transition-all duration-200 group backdrop-blur-sm"
							aria-label="Close"
						>
							<IoClose
								size={22}
								className="group-hover:rotate-90 transition-transform duration-200"
							/>
						</button>
					</div>

					{/* Modal Body */}
					<div className="px-8 pb-8">
						<div className="space-y-4">
							{buttonOptions.map((option) => {
								const IconComponent = option.icon;
								return (
									<button
										key={option.id}
										onClick={option.onClick}
										onMouseEnter={() => setHoveredButton(option.id)}
										onMouseLeave={() => setHoveredButton(null)}
										className={`w-full group relative cursor-pointer overflow-hidden bg-gradient-to-r ${option.gradient} ${option.hoverGradient} text-white px-6 py-5 rounded-2xl font-semibold transition-all duration-300 hover:shadow-xl ${option.shadowColor} hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 active:scale-95`}
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-4">
												<div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
													<IconComponent
														size={22}
														className={`transition-transform duration-300 ${
															hoveredButton === option.id
																? "rotate-12 scale-110"
																: ""
														}`}
													/>
												</div>
												<div className="text-left">
													<div className="text-lg font-semibold">
														{option.label}
													</div>
													<div className="text-sm text-white/80 font-normal">
														{option.description}
													</div>
												</div>
											</div>
											<div className="opacity-60 group-hover:opacity-100 transition-opacity duration-300">
												<svg
													width="20"
													height="20"
													viewBox="0 0 24 24"
													fill="none"
													className="transform group-hover:translate-x-1 transition-transform duration-300"
												>
													<path
														d="M9 18l6-6-6-6"
														stroke="currentColor"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													/>
												</svg>
											</div>
										</div>

										{/* Shimmer effect */}
										<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>

										{/* Active state indicator */}
										<div
											className={`absolute inset-0 bg-white/5 rounded-2xl transition-opacity duration-300 ${
												hoveredButton === option.id
													? "opacity-100"
													: "opacity-0"
											}`}
										></div>
									</button>
								);
							})}
						</div>
					</div>
				</div>
			</div>
			<AddSourcesModal
				isOpen={showAdd}
				onClose={() => setShowAdd(false)}
				onFileUpload={handleFileUpload}
				onShowText={() => setShowText(true)}
				onShowLink={(type) => {
					setLinkType(type);
					setShowLink(true);
				}}
			/>

			<AddKeywordModal
				isOpen={showKeyword}
				onClose={() => setShowKeyword(false)}
				onFileUpload={handleFileUpload}
				onShowText={() => setShowText(true)}
				onShowLink={(type) => {
					setLinkType(type);
					setShowLink(true);
				}}
			/>

			<AddSourcesCompetitor
				isOpen={showSourceCompetitor}
				onClose={() => setSourceCompetitor(false)}
				onFileUpload={handleFileUpload}
				onShowText={() => setShowText(true)}
				onShowLink={(type) => {
					setLinkType(type);
					setShowLink(true);
				}}
			/>

			<TextModal
				isOpen={showText}
				onClose={() => setShowText(false)}
				projectId={projectId}
				componentId={componentId}
				domainId={domainId}
				onAdd={handleAddSource}
			/>
		</>
	);
}
