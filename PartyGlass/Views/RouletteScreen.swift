import SwiftUI

struct RouletteScreen: View {
    let namespace: Namespace.ID
    @State private var options: [String] = ["Shotgun", "Beer Pong", "Karaoke", "Strip Poker", "Never Have I Ever", "Spin Again"]
    @State private var newOption = ""
    @State private var highlightIndex = -1
    @State private var isSpinning = false
    @State private var degrees: Double = 0

    var body: some View {
        VStack(spacing: DesignToken.stackSpacing) {
            // Header
            Text("Roulette")
                .font(.largeTitle.bold())
                .foregroundStyle(DesignToken.textPrimary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.top, 60)
                .padding(.horizontal, DesignToken.margin)

            // Input
            HStack(spacing: 8) {
                TextField("Add option...", text: $newOption)
                    .textFieldStyle(.plain)
                    .font(.body)
                    .foregroundStyle(DesignToken.textPrimary)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(
                        RoundedRectangle(cornerRadius: DesignToken.pillCorner)
                            .stroke(DesignToken.glassStroke, lineWidth: 0.5)
                    )
                    .glassEffectIfAvailable(.regular.tint(.orange.opacity(0.08)),
                                            shape: .capsule)

                Button { addOption() } label: {
                    Image(systemName: "plus")
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(.white)
                        .frame(width: 44, height: 44)
                }
                .glassButtonStyle(tint: .orange)
            }
            .padding(.horizontal, DesignToken.margin)

            // Spin Button
            GlassButton(title: isSpinning ? "Spinning..." : "🎡 Spin the Wheel",
                       icon: "arrow.triangle.2.circlepath",
                       action: spin,
                       tint: .orange)
                .disabled(isSpinning || options.isEmpty)
                .padding(.horizontal, DesignToken.margin)

            // Options List
            ScrollView {
                VStack(spacing: 8) {
                    ForEach(Array(options.enumerated()), id: \.offset) { i, option in
                        HStack {
                            Text("\(i + 1)")
                                .font(.caption)
                                .foregroundStyle(DesignToken.textTertiary)
                                .frame(width: 24)
                            Text(option)
                                .font(.body)
                                .foregroundStyle(highlightIndex == i
                                    ? .black : DesignToken.textPrimary)
                            Spacer()
                            Button { withAnimation { options.remove(at: i) } } label: {
                                Image(systemName: "xmark")
                                    .font(.caption2)
                                    .foregroundStyle(DesignToken.textTertiary)
                                    .frame(width: 28, height: 28)
                                    .background(Circle().fill(.ultraThinMaterial))
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(highlightIndex == i
                                    ? DesignToken.chipGold
                                    : .clear)
                        )
                        .glassEffectIfAvailable(highlightIndex != i
                            ? .regular.tint(.orange.opacity(0.06))
                            : .identity,
                                                shape: RoundedRectangle(cornerRadius: 12))
                    }
                }
                .padding(.horizontal, DesignToken.margin)
            }
            .padding(.bottom, 80)
        }
    }

    private func addOption() {
        guard !newOption.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        withAnimation {
            options.append(newOption.trimmingCharacters(in: .whitespaces))
            newOption = ""
        }
    }

    private func spin() {
        guard !options.isEmpty else { return }
        isSpinning = true
        highlightIndex = -1

        withAnimation(.spring(response: 0.8, dampingFraction: 0.6)) {
            degrees += 1080
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.9) {
            let idx = Int.random(in: 0..<options.count)
            withAnimation(DesignToken.springBouncy) {
                highlightIndex = idx
                isSpinning = false
            }
            let generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.success)
        }
    }
}
