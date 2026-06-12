import SwiftUI

struct TruthDareScreen: View {
    let namespace: Namespace.ID
    @State private var type: TDType = .truth
    @State private var difficulty: Difficulty = .normal
    @State private var currentQuestion: String = ""
    @State private var showQuestion = false

    enum TDType: String, CaseIterable {
        case truth = "Truth"
        case dare = "Dare"
        var icon: String {
            self == .truth ? "bubble.left.fill" : "flame.fill"
        }
    }

    enum Difficulty: String, CaseIterable {
        case normal = "Normal"
        case spicy = "Spicy"
    }

    var body: some View {
        VStack(spacing: DesignToken.stackSpacing) {
            // Header
            Text("Truth or Dare")
                .font(.largeTitle.bold())
                .foregroundStyle(DesignToken.textPrimary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.top, 60)
                .padding(.horizontal, DesignToken.margin)

            // Type Picker
            GlassCard(tint: .purple.opacity(0.08)) {
                HStack(spacing: 0) {
                    ForEach(TDType.allCases, id: \.self) { t in
                        Button {
                            withAnimation(DesignToken.springSmooth) { type = t }
                        } label: {
                            Label(t.rawValue, systemImage: t.icon)
                                .font(.headline)
                                .foregroundStyle(type == t
                                    ? DesignToken.textPrimary
                                    : DesignToken.textTertiary)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(type == t
                                    ? .ultraThinMaterial.opacity(0.5)
                                    : .clear)
                                .clipShape(.capsule)
                        }
                    }
                }
                .padding(4)
                .background(.ultraThinMaterial.opacity(0.3))
                .clipShape(.capsule)
            }
            .padding(.horizontal, DesignToken.margin)

            // Difficulty Picker
            HStack(spacing: 12) {
                ForEach(Difficulty.allCases, id: \.self) { d in
                    Button {
                        withAnimation { difficulty = d }
                    } label: {
                        HStack(spacing: 6) {
                            Circle()
                                .fill(d == .spicy ? DesignToken.lose : DesignToken.textSecondary)
                                .frame(width: 8, height: 8)
                            Text(d.rawValue)
                                .font(.subheadline.weight(difficulty == d ? .semibold : .regular))
                        }
                        .foregroundStyle(difficulty == d
                            ? DesignToken.textPrimary
                            : DesignToken.textTertiary)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 8)
                        .background(
                            Capsule()
                                .stroke(difficulty == d ? DesignToken.glassHighlight : DesignToken.glassStroke,
                                        lineWidth: 0.5)
                        )
                    }
                    .glassEffectIfAvailable(difficulty == d
                        ? .regular.tint((d == .spicy ? Color.red : Color.blue).opacity(0.15)).interactive()
                        : .identity,
                                            shape: .capsule)
                }
            }
            .padding(.horizontal, DesignToken.margin)

            Spacer()

            // Question Card
            GlassCard(tint: .purple.opacity(0.1)) {
                VStack(spacing: 20) {
                    if showQuestion {
                        Text(currentQuestion)
                            .font(.title3.weight(.medium))
                            .foregroundStyle(DesignToken.textPrimary)
                            .multilineTextAlignment(.center)
                            .padding(.vertical, 20)
                            .transition(.scale.combined(with: .opacity))
                    } else {
                        Image(systemName: type.icon)
                            .font(.system(size: 48))
                            .foregroundStyle(DesignToken.textTertiary)
                        Text("Tap to draw")
                            .font(.title3)
                            .foregroundStyle(DesignToken.textTertiary)
                    }
                }
                .frame(maxWidth: .infinity, minHeight: 200)
            }
            .padding(.horizontal, DesignToken.margin)

            Spacer()

            // Draw Button
            GlassButton(title: "Draw a Card",
                       icon: "arrowtriangle.down.circle.fill",
                       action: drawQuestion,
                       tint: .purple)
                .padding(.horizontal, DesignToken.margin)
                .padding(.bottom, 80)
        }
    }

    private func drawQuestion() {
        let questions: [TDType: [Difficulty: [String]]] = [
            .truth: [
                .normal: truthNormal,
                .spicy: truthSpicy
            ],
            .dare: [
                .normal: dareNormal,
                .spicy: dareSpicy
            ]
        ]
        let pool = questions[type]![difficulty]!
        currentQuestion = pool.randomElement() ?? "No questions available"
        withAnimation(DesignToken.springBouncy) {
            showQuestion = true
        }
    }

    private let truthNormal: [String] = [
        "What's your biggest fear?", "What's your most embarrassing memory?",
        "What's your secret talent?", "What's your ideal weekend?",
        "What's the last lie you told?", "What's your guilty pleasure?"
    ]
    private let truthSpicy: [String] = [
        "Who here do you secretly have a crush on?", "What's the wildest thing you've done?",
        "Have you ever cheated on a partner?", "What's your biggest secret?",
        "Who's the most attractive person here?", "What's your most shameful moment?"
    ]
    private let dareNormal: [String] = [
        "Do 10 pushups right now", "Sing a children's song",
        "Make the ugliest face for 10 seconds", "Speak in a funny accent for 1 minute",
        "Do your best animal impression", "Compliment everyone in the room"
    ]
    private let dareSpicy: [String] = [
        "Do a lap around the room dancing", "Post an embarrassing confession on social media",
        "Let someone draw on your face", "Call your crush and say something nice",
        "Do your best sensual dance", "Share your most embarrassing photo"
    ]
}
