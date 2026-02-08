import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/providers/ProgressProvider";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-jetbrains-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Chithi - Secure File Sharing",
	description: "Self-hostable, encrypted file sharing for humans.",
	icons: {
 		icon: '/favicon.svg',
 	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<link rel="icon" href="/favicon.svg" />
			</head>
			<body
				className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
			>
				<Providers>
					{children}
				</Providers>
			</body>
		</html>
	);
}
