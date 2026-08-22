export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type QuestionType = "MCQ" | "MULTI_SELECT" | "TRUE_FALSE";

export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "EXPIRED";

export type QuestionStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";

export interface UserDto {
	id: number;
	name: string;
	email: string;
	role: string;
}

export interface AuthResponse {
	accessToken: string;
	refreshToken: string;
	tokenType: string;
	expiresInMs: number;
	user: UserDto;
}

export interface CategoryDto {
	id: number;
	name: string;
	slug: string;
	description: string | null;
}

export interface QuizDto {
	id: number;
	title: string;
	description: string | null;
	categoryId: number;
	categoryName: string;
	categorySlug: string;
	difficulty: Difficulty;
	timeLimitSec: number;
	isPublished: boolean;
	questionCount: number;
	tags: string[];
	createdBy: string | null;
	createdAt: string;
}

export interface OptionPublicDto {
	optionId: number;
	optionText: string;
}

export interface QuestionPublicDto {
	questionId: number;
	questionText: string;
	type: QuestionType;
	points: number;
	options: OptionPublicDto[];
}

export interface StartAttemptResponse {
	attemptId: number;
	quizId: number;
	quizTitle: string;
	timeLimitSec: number;
	startedAt: string;
	expiresAt: string;
	questions: QuestionPublicDto[];
}

export interface SubmitAnswerDto {
	questionId: number;
	selectedOptionIds: number[];
}

export interface QuestionResultDto {
	questionId: number;
	questionText: string;
	type: QuestionType;
	points: number;
	awardedPoints: number;
	correct: boolean;
	selectedOptionIds: number[];
	correctOptionIds: number[];
	explanation: string | null;
}

export interface AttemptResultDto {
	attemptId: number;
	quizId: number;
	quizTitle: string;
	status: AttemptStatus;
	score: number;
	totalPoints: number;
	percentage: number;
	startedAt: string;
	completedAt: string | null;
	durationSeconds: number;
	questions: QuestionResultDto[];
}

export interface UserStatsDto {
	totalAttempts: number;
	completedAttempts: number;
	averagePercentage: number;
	bestPercentage: number;
	totalPointsEarned: number;
	currentStreak: number;
	bestStreak: number;
}

export interface QuestionAdminOption {
	optionId: number;
	optionText: string;
	isCorrect: boolean;
}

export interface QuestionAdminDto {
	questionId: number;
	quizId: number;
	questionText: string;
	type: QuestionType;
	points: number;
	explanation: string | null;
	status: QuestionStatus;
	options: QuestionAdminOption[];
}

export interface BulkUploadResult {
	imported: number;
	failures: { lineNumber: number; error: string }[];
}

export interface GenerateQuestionsPayload {
	topic: string;
	count: number;
	questionType: QuestionType;
	difficulty?: Difficulty;
}

export interface GeneratedQuestionsResult {
	created: number;
	discarded: number;
	questions: QuestionAdminDto[];
}

export interface LeaderboardEntryDto {
	rank: number;
	userId: number;
	name: string;
	score: number;
}

export interface BadgeDto {
	code: string;
	name: string;
	description: string;
	earned: boolean;
}

export interface CategoryProgressDto {
	categoryId: number;
	categoryName: string;
	totalQuizzes: number;
	completedQuizzes: number;
	eligible: boolean;
}

export interface CertificateDto {
	code: string;
	userName: string;
	categoryId: number;
	categoryName: string;
	issuedAt: string;
}

export interface PlayerInfo {
	playerId: string;
	nickname: string;
	score: number;
	answeredCurrent: boolean;
}

export type LiveRoomStatus = "LOBBY" | "ACTIVE" | "ENDED";

export interface LiveRoomInfo {
	code: string;
	quizTitle: string;
	hostName: string;
	status: LiveRoomStatus;
	players: PlayerInfo[];
}

export interface LiveQuestionPayload {
	index: number;
	total: number;
	question: QuestionPublicDto;
	endsAtEpochMs: number;
	scoreboard: PlayerInfo[];
}

export interface FinalResultsPayload {
	code: string;
	quizTitle: string;
	entries: PlayerInfo[];
}
