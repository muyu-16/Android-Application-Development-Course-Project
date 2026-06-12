import SwiftUI

struct RPSScreen: View {
    let namespace: Namespace.ID
    @State private var playerMove: String? = nil
    @State private var computerMove: String? = nil
    @State private var result: String = "VS"
    @State private var winCount = 0
    @State private var loseCount = 0
    @State private var drawCount = 0

    private let moves = ["rock", "paper", "scissors"]
    private let moveIcons: [String: String] = [
        "rock": "hand.raised.fingerspiral.fill",
        "paper": "paperplane.fill",
        "scissors": "scissors"
    ]
    private let moveEmoji: [String: String] = [
        "rock": "✊",
        "paper": "✋",
        "scissors": "✌️"
    ]

    var body: some View {
        VStack(spacing: DesignToken.stackSpacing) {
            // Header
            Text("Battle")
                .font(.largeTitle.bold())
                .foregroundStyle(DesignToken.textPrimary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.top, 60)
                .padding(.horizontal, DesignToken.margin)

            // Scoreboard
            GlassScoreboard(win: winCount, lose: loseCount, draw: drawCount)
                .padding(.horizontal, DesignToken.margin)

            // Battle Arena
            GlassCard(tint: .blue.opacity(0.08)) {
                VStack(spacing: 16) {
                    // Computer
                    VStack(spacing: 4) {
                        Text("COMPUTER")
                            .font(.caption)
                            .foregroundStyle(DesignToken.textTertiary)
                        Text(computerMove == nil ? "❓" : moveEmoji[computerMove!]!)
                            .font(.system(size: 60))
                        Text(computerMove?.capitalized ?? "Waiting...")
                            .font(.callout)
                            .foregroundStyle(DesignToken.textSecondary)
                    }

                    // Result
                    Text(result)
                        .font(.title2.weight(.bold))
                        .foregroundStyle(resultColor)
                        .padding(.vertical, 8)

                    // Player
                    VStack(spacing: 4) {
                        Text("YOU")
                            .font(.caption)
                            .foregroundStyle(DesignToken.textTertiary)
                        Text(playerMove == nil ? "❓" : moveEmoji[playerMove!]!)
                            .font(.system(size: 60))
                        Text(playerMove?.capitalized ?? "Tap to play")
                            .font(.callout)
                            .foregroundStyle(DesignToken.textSecondary)
                    }
                }
                .frame(maxWidth: .infinity)
            }
            .padding(.horizontal, DesignToken.margin)

            // Controls
            HStack(spacing: 12) {
                ForEach(moves, id: \.self) { move in
                    Button {
                        play(move)
                    } label: {
                        Text(moveEmoji[move]!)
                            .font(.system(size: 36))
                            .frame(maxWidth: .infinity, minHeight: 64)
                            .background(
                                RoundedRectangle(cornerRadius: DesignToken.pillCorner)
                                    .stroke(DesignToken.glassStroke, lineWidth: 0.5)
                            )
                    }
                    .glassEffectIfAvailable(.regular.tint(moveColor(move)).interactive(),
                                            shape: .capsule)
                }
            }
            .padding(.horizontal, DesignToken.margin)

            // Reset
            Button("Reset Scores") {
                withAnimation {
                    winCount = 0; loseCount = 0; drawCount = 0
                    playerMove = nil; computerMove = nil; result = "VS"
                }
            }
            .font(.footnote)
            .foregroundStyle(DesignToken.textTertiary)
            .padding(.bottom, 80)
        }
    }

    private func play(_ player: String) {
        let computer = moves.randomElement()!
        playerMove = player
        computerMove = computer

        if player == computer {
            result = "Draw"
            drawCount += 1
        } else if (player == "rock" && computer == "scissors") ||
                  (player == "paper" && computer == "rock") ||
                  (player == "scissors" && computer == "paper") {
            result = "You Win! 🎉"
            winCount += 1
        } else {
            result = "You Lose 😵"
            loseCount += 1
        }
    }

    private func moveColor(_ move: String) -> Color {
        switch move {
        case "rock": return .red
        case "paper": return .blue
        case "scissors": return .green
        default: return .blue
        }
    }

    private var resultColor: Color {
        if result.contains("Win") { return DesignToken.win }
        if result.contains("Lose") { return DesignToken.lose }
        if result == "Draw" { return DesignToken.draw }
        return DesignToken.textSecondary
    }
}
