/*
 * Copyright the original author or authors.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

package de.schildbach.wallet.ui.send;

import android.os.Handler;
import android.os.Looper;
import org.bitcoinj.core.ECKey;
import org.bitcoinj.crypto.BIP38PrivateKey;

/**
 * @author Andreas Schildbach
 */
public abstract class DecodePrivateKeyTask {
    private final Handler backgroundHandler;
    private final Handler callbackHandler;

    public DecodePrivateKeyTask(final Handler backgroundHandler) {
        this.backgroundHandler = backgroundHandler;
        this.callbackHandler = new Handler(Looper.myLooper());
    }

    public final void decodePrivateKey(final BIP38PrivateKey encryptedKey, final String passphrase) {
        backgroundHandler.post(() -> {
            try {
                final ECKey decryptedKey = encryptedKey.decrypt(passphrase); // takes time

                callbackHandler.post(() -> onSuccess(decryptedKey));
            } catch (final BIP38PrivateKey.BadPassphraseException x) {
                callbackHandler.post(() -> onBadPassphrase());
            }
        });
    }

    protected abstract void onSuccess(ECKey decryptedKey);

    protected abstract void onBadPassphrase();
}
